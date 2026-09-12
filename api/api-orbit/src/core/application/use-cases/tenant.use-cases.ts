import crypto from 'node:crypto';
import { ConflictError } from '../../../app/http/errors/conflict-error.js';
import { ValidationError } from '../../../app/http/errors/validation-error.js';
import type { PlanRepository } from '../../domain/plan/plan.repository.js';
import type { SubscriptionRepository } from '../../domain/subscription/subscription.repository.js';
import type {
	Tenant,
	TenantStatus,
	TenantWithRelations,
} from '../../domain/tenant/tenant.entity.js';
import type { TenantRepository } from '../../domain/tenant/tenant.repository.js';
import {
	createTenantSchema,
	tenantSearchSchema,
	type UpdateTenantInput,
} from '../../domain/tenant/tenant.schema.js';
import type { UserRepository } from '../../domain/user/user.repository.js';
import type { PasswordHasher } from '../../domain/value-objects/password.js';

function isUniqueConstraintError(
	error: unknown,
): error is { code: string; meta?: { target?: string[] } } {
	return Boolean(
		error &&
			typeof error === 'object' &&
			'code' in error &&
			(error as { code: unknown }).code === 'P2002',
	);
}

/** Cria tenant + usuário owner + (opcional) assinatura inicial — usado pelo operador. */
export class CreateTenantUseCase {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly userRepository: UserRepository,
		private readonly subscriptionRepository: SubscriptionRepository,
		private readonly passwordHasher: PasswordHasher,
	) {}

	async execute(data: unknown): Promise<Tenant> {
		const parsed = createTenantSchema.safeParse(data);
		if (!parsed.success) {
			throw new ValidationError(
				parsed.error.errors[0]?.message ??
					'Dados inválidos para criação de tenant',
			);
		}
		const input = parsed.data;

		let tenant: Tenant;
		try {
			tenant = await this.tenantRepository.create({
				name: input.name,
				slug: input.slug,
				status: input.status,
			});
		} catch (error) {
			if (
				isUniqueConstraintError(error) &&
				error.meta?.target?.includes('slug')
			) {
				throw new ConflictError(`O slug "${input.slug}" já está em uso`);
			}
			throw error;
		}

		const passwordHash = await this.passwordHasher.hash(input.user.password);
		try {
			await this.userRepository.create({
				email: input.user.email,
				name: input.user.name,
				passwordHash,
				role: 'OWNER',
				tenantId: tenant.id,
			});
		} catch (error) {
			if (
				isUniqueConstraintError(error) &&
				error.meta?.target?.includes('email')
			) {
				throw new ConflictError(
					`O email "${input.user.email}" já está cadastrado`,
				);
			}
			throw error;
		}

		if (input.planId) {
			await this.subscriptionRepository.create({
				tenantId: tenant.id,
				planId: input.planId,
				licenseKey: crypto.randomUUID(),
				status: 'ACTIVE',
			});
		}

		return tenant;
	}
}

export class UpdateTenantUseCase {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(id: string, data: UpdateTenantInput): Promise<Tenant> {
		return this.tenantRepository.update(id, data);
	}
}

/** Kill switch: bloqueia/libera o acesso do tenant (reflete na próxima validação de licença). */
export class SetTenantStatusUseCase {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(id: string, status: TenantStatus): Promise<Tenant> {
		return this.tenantRepository.setStatus(id, status);
	}
}

export class ListTenantsUseCase {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(): Promise<TenantWithRelations[]> {
		return this.tenantRepository.list();
	}
}

export class SearchTenantsUseCase {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(query: string): Promise<TenantWithRelations[]> {
		const parsed = tenantSearchSchema.safeParse({ query });
		if (!parsed.success) {
			throw new ValidationError(
				parsed.error.errors[0]?.message ?? 'Query de busca inválida',
			);
		}
		return this.tenantRepository.search(parsed.data.query);
	}
}

export class GetTenantUseCase {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(id: string): Promise<Tenant | null> {
		return this.tenantRepository.findById(id);
	}
}

/**
 * Associa um plano a um tenant existente — upgrade/downgrade se já houver
 * assinatura ativa do mesmo produto, ou cria uma nova.
 */
export class AddTenantSubscriptionUseCase {
	constructor(
		private readonly planRepository: PlanRepository,
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(tenantId: string, planId: string) {
		const plan = await this.planRepository.findById(planId);
		if (!plan) throw new ValidationError('Plan not found');

		const existing =
			await this.subscriptionRepository.findActiveForTenantProduct(
				tenantId,
				plan.productId,
			);

		if (existing) {
			if (existing.planId === planId) return existing;
			await this.subscriptionRepository.updateStatus(existing.id, 'CANCELED');
		}

		return this.subscriptionRepository.create({
			tenantId,
			planId,
			licenseKey: `LIC-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
			status: 'ACTIVE',
		});
	}
}

export interface SyncTenantInput {
	name: string;
	email: string;
}

/**
 * Chamado pelo backend de um tenant app no signup do usuário final. Encontra
 * o tenant pelo email do owner ou cria um novo — não recebe senha (o usuário
 * já se autenticou no app do tenant; aqui é só provisionamento).
 */
export class SyncTenantUseCase {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly userRepository: UserRepository,
	) {}

	async execute(input: SyncTenantInput): Promise<Tenant> {
		const existingUser = await this.userRepository.findByEmail(input.email);
		if (existingUser) {
			const tenant = await this.tenantRepository.findById(
				existingUser.tenantId,
			);
			if (tenant) return tenant;
		}

		const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${crypto.randomBytes(2).toString('hex')}`;
		const tenant = await this.tenantRepository.create({
			name: input.name,
			slug,
		});

		await this.userRepository.create({
			email: input.email,
			name: input.name,
			passwordHash: 'oauth-managed',
			role: 'OWNER',
			tenantId: tenant.id,
		});

		return tenant;
	}
}
