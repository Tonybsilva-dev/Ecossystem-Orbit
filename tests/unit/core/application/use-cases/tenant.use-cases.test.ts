import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../../../../src/app/http/errors/conflict-error.js';
import { ValidationError } from '../../../../../src/app/http/errors/validation-error.js';
import {
	AddTenantSubscriptionUseCase,
	CreateTenantUseCase,
	SetTenantStatusUseCase,
	SyncTenantUseCase,
} from '../../../../../src/core/application/use-cases/tenant.use-cases.js';
import type { PlanRepository } from '../../../../../src/core/domain/plan/plan.repository.js';
import type { SubscriptionRepository } from '../../../../../src/core/domain/subscription/subscription.repository.js';
import type { TenantRepository } from '../../../../../src/core/domain/tenant/tenant.repository.js';
import type { UserRepository } from '../../../../../src/core/domain/user/user.repository.js';
import type { PasswordHasher } from '../../../../../src/core/domain/value-objects/password.js';

const now = new Date();
const tenant = {
	id: 'tenant-1',
	name: 'Acme',
	slug: 'acme',
	status: 'ACTIVE' as const,
	createdAt: now,
	updatedAt: now,
};

function makeTenantRepo(
	overrides: Partial<TenantRepository> = {},
): TenantRepository {
	return {
		findById: vi.fn(),
		findBySlug: vi.fn(),
		list: vi.fn(),
		search: vi.fn(),
		create: vi.fn().mockResolvedValue(tenant),
		update: vi.fn(),
		setStatus: vi.fn().mockResolvedValue({ ...tenant, status: 'INACTIVE' }),
		...overrides,
	};
}

function makeUserRepo(overrides: Partial<UserRepository> = {}): UserRepository {
	return {
		findById: vi.fn(),
		findByEmail: vi.fn().mockResolvedValue(null),
		create: vi.fn().mockResolvedValue({ id: 'user-1' }),
		...overrides,
	};
}

function makeSubscriptionRepo(
	overrides: Partial<SubscriptionRepository> = {},
): SubscriptionRepository {
	return {
		findById: vi.fn(),
		findByLicenseKey: vi.fn(),
		findByLicenseKeyWithFeatures: vi.fn(),
		findActiveForTenantProduct: vi.fn().mockResolvedValue(null),
		list: vi.fn(),
		create: vi.fn().mockResolvedValue({ id: 'sub-1', licenseKey: 'LIC-XXXX' }),
		updateStatus: vi.fn(),
		delete: vi.fn(),
		countByPlan: vi.fn(),
		countByProductAndStatus: vi.fn(),
		listActiveByProduct: vi.fn(),
		...overrides,
	};
}

describe('CreateTenantUseCase', () => {
	const passwordHasher: PasswordHasher = {
		hash: vi.fn().mockResolvedValue('hashed'),
		compare: vi.fn(),
	};

	it('rejeita input inválido antes de tocar no banco', async () => {
		const tenantRepo = makeTenantRepo();
		const useCase = new CreateTenantUseCase(
			tenantRepo,
			makeUserRepo(),
			makeSubscriptionRepo(),
			passwordHasher,
		);

		await expect(
			useCase.execute({
				name: 'ab',
				slug: 'ok',
				user: { email: 'x@x.com', password: '123' },
			}),
		).rejects.toThrow(ValidationError);
		expect(tenantRepo.create).not.toHaveBeenCalled();
	});

	it('traduz slug duplicado (P2002) em ConflictError', async () => {
		const tenantRepo = makeTenantRepo({
			create: vi
				.fn()
				.mockRejectedValue({ code: 'P2002', meta: { target: ['slug'] } }),
		});
		const useCase = new CreateTenantUseCase(
			tenantRepo,
			makeUserRepo(),
			makeSubscriptionRepo(),
			passwordHasher,
		);

		await expect(
			useCase.execute({
				name: 'Acme Corp',
				slug: 'acme',
				user: { email: 'x@x.com', password: 'senhaSegura123' },
			}),
		).rejects.toThrow(ConflictError);
	});

	it('cria tenant + owner e, se houver planId, a assinatura inicial', async () => {
		const tenantRepo = makeTenantRepo();
		const userRepo = makeUserRepo();
		const subscriptionRepo = makeSubscriptionRepo();
		const useCase = new CreateTenantUseCase(
			tenantRepo,
			userRepo,
			subscriptionRepo,
			passwordHasher,
		);

		const result = await useCase.execute({
			name: 'Acme Corp',
			slug: 'acme',
			planId: '123e4567-e89b-12d3-a456-426614174000',
			user: { email: 'owner@acme.com', password: 'senhaSegura123' },
		});

		expect(result).toEqual(tenant);
		expect(userRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ role: 'OWNER', tenantId: tenant.id }),
		);
		expect(subscriptionRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ tenantId: tenant.id }),
		);
	});
});

describe('SetTenantStatusUseCase (kill switch)', () => {
	it('chama setStatus com o status pedido', async () => {
		const tenantRepo = makeTenantRepo();
		const useCase = new SetTenantStatusUseCase(tenantRepo);

		const result = await useCase.execute('tenant-1', 'INACTIVE');

		expect(tenantRepo.setStatus).toHaveBeenCalledWith('tenant-1', 'INACTIVE');
		expect(result.status).toBe('INACTIVE');
	});
});

describe('AddTenantSubscriptionUseCase', () => {
	it('rejeita plano inexistente', async () => {
		const planRepo = {
			findById: vi.fn().mockResolvedValue(null),
		} as unknown as PlanRepository;
		const useCase = new AddTenantSubscriptionUseCase(
			planRepo,
			makeSubscriptionRepo(),
		);
		await expect(
			useCase.execute('tenant-1', 'plan-inexistente'),
		).rejects.toThrow(ValidationError);
	});

	it('retorna a assinatura existente se já é o mesmo plano', async () => {
		const plan = { id: 'plan-1', productId: 'prod-1' };
		const planRepo = {
			findById: vi.fn().mockResolvedValue(plan),
		} as unknown as PlanRepository;
		const existing = { id: 'sub-existing', planId: 'plan-1' };
		const subscriptionRepo = makeSubscriptionRepo({
			findActiveForTenantProduct: vi.fn().mockResolvedValue(existing),
		});

		const useCase = new AddTenantSubscriptionUseCase(
			planRepo,
			subscriptionRepo,
		);
		const result = await useCase.execute('tenant-1', 'plan-1');

		expect(result).toBe(existing);
		expect(subscriptionRepo.create).not.toHaveBeenCalled();
	});

	it('cancela a assinatura anterior e cria uma nova em caso de upgrade', async () => {
		const plan = { id: 'plan-2', productId: 'prod-1' };
		const planRepo = {
			findById: vi.fn().mockResolvedValue(plan),
		} as unknown as PlanRepository;
		const existing = { id: 'sub-existing', planId: 'plan-1' };
		const subscriptionRepo = makeSubscriptionRepo({
			findActiveForTenantProduct: vi.fn().mockResolvedValue(existing),
		});

		const useCase = new AddTenantSubscriptionUseCase(
			planRepo,
			subscriptionRepo,
		);
		await useCase.execute('tenant-1', 'plan-2');

		expect(subscriptionRepo.updateStatus).toHaveBeenCalledWith(
			'sub-existing',
			'CANCELED',
		);
		expect(subscriptionRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ tenantId: 'tenant-1', planId: 'plan-2' }),
		);
	});
});

describe('SyncTenantUseCase', () => {
	it('reaproveita o tenant se o email já pertence a um usuário existente', async () => {
		const userRepo = makeUserRepo({
			findByEmail: vi.fn().mockResolvedValue({ tenantId: 'tenant-1' }),
		});
		const tenantRepo = makeTenantRepo({
			findById: vi.fn().mockResolvedValue(tenant),
		});
		const useCase = new SyncTenantUseCase(tenantRepo, userRepo);

		const result = await useCase.execute({
			name: 'Acme',
			email: 'owner@acme.com',
		});

		expect(result).toBe(tenant);
		expect(tenantRepo.create).not.toHaveBeenCalled();
	});

	it('cria tenant + user quando o email é novo', async () => {
		const userRepo = makeUserRepo();
		const tenantRepo = makeTenantRepo();
		const useCase = new SyncTenantUseCase(tenantRepo, userRepo);

		await useCase.execute({ name: 'Acme', email: 'owner@acme.com' });

		expect(tenantRepo.create).toHaveBeenCalled();
		expect(userRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ passwordHash: 'oauth-managed' }),
		);
	});
});
