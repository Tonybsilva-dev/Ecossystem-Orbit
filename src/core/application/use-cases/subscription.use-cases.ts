import crypto from 'node:crypto';
import { ValidationError } from '../../../app/http/errors/validation-error.js';
import type { PlanRepository } from '../../domain/plan/plan.repository.js';
import type {
	Subscription,
	SubscriptionWithRelations,
} from '../../domain/subscription/subscription.entity.js';
import type {
	ListSubscriptionsParams,
	ListSubscriptionsResult,
	SubscriptionRepository,
} from '../../domain/subscription/subscription.repository.js';
import type { TenantRepository } from '../../domain/tenant/tenant.repository.js';
import type { UserRepository } from '../../domain/user/user.repository.js';

export interface SelfServiceSignupInput {
	tenantName: string;
	email: string;
	planId: string;
	slug?: string;
	interval?: 'MONTHLY' | 'YEARLY';
}

export interface SelfServiceSignupOutput {
	licenseKey: string;
	plan: { name: string; features: string[]; limits: unknown };
}

/**
 * Self-service: um novo tenant se cadastra num produto (ex: onboarding do
 * barber-flow). Cria Tenant + User (se o email ainda não existir em nenhum
 * tenant) + Subscription. Público — não requer secret de operador.
 */
export class SelfServiceSignupUseCase {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly userRepository: UserRepository,
		private readonly planRepository: PlanRepository,
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(
		input: SelfServiceSignupInput,
	): Promise<SelfServiceSignupOutput> {
		if (!input.tenantName || !input.email || !input.planId) {
			throw new ValidationError(
				'Missing required fields: tenantName, email, planId',
			);
		}

		const plan = await this.planRepository.findById(input.planId);
		if (!plan?.isActive) throw new ValidationError('Invalid or inactive plan');

		const baseSlug =
			input.slug ||
			input.tenantName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
		const uniqueSlug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;

		const tenant = await this.tenantRepository.create({
			name: input.tenantName,
			slug: uniqueSlug,
			status: 'ACTIVE',
		});

		const existingUser = await this.userRepository.findByEmail(input.email);
		if (!existingUser) {
			await this.userRepository.create({
				email: input.email,
				name: input.tenantName.split(' ')[0] || 'Admin',
				role: 'ADMIN',
				passwordHash: 'oauth-managed',
				tenantId: tenant.id,
			});
		}

		const licenseKey =
			crypto
				.randomBytes(8)
				.toString('hex')
				.toUpperCase()
				.match(/.{1,4}/g)
				?.join('-') ?? 'KEY-ERROR';

		const expiresAt = new Date();
		const effectiveInterval =
			input.interval === 'YEARLY' || input.interval === 'MONTHLY'
				? input.interval
				: plan.interval;
		if (effectiveInterval === 'MONTHLY')
			expiresAt.setMonth(expiresAt.getMonth() + 1);
		else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

		const subscription = await this.subscriptionRepository.create({
			tenantId: tenant.id,
			planId: plan.id,
			licenseKey,
			status: 'ACTIVE',
			expiresAt,
		});

		return {
			licenseKey: subscription.licenseKey,
			plan: { name: plan.name, features: plan.features, limits: plan.limits },
		};
	}
}

export class ListSubscriptionsUseCase {
	constructor(
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(
		params: ListSubscriptionsParams,
	): Promise<ListSubscriptionsResult> {
		return this.subscriptionRepository.list(params);
	}
}

export class GetSubscriptionUseCase {
	constructor(
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(id: string): Promise<SubscriptionWithRelations | null> {
		return this.subscriptionRepository.findById(id);
	}
}

export class CancelSubscriptionUseCase {
	constructor(
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(id: string): Promise<Subscription> {
		return this.subscriptionRepository.updateStatus(id, 'CANCELED', new Date());
	}
}

export class DeleteSubscriptionUseCase {
	constructor(
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(id: string): Promise<void> {
		return this.subscriptionRepository.delete(id);
	}
}
