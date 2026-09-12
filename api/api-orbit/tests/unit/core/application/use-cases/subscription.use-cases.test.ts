import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../../../../src/app/http/errors/validation-error.js';
import { SelfServiceSignupUseCase } from '../../../../../src/core/application/use-cases/subscription.use-cases.js';
import type { PlanRepository } from '../../../../../src/core/domain/plan/plan.repository.js';
import type { SubscriptionRepository } from '../../../../../src/core/domain/subscription/subscription.repository.js';
import type { TenantRepository } from '../../../../../src/core/domain/tenant/tenant.repository.js';
import type { UserRepository } from '../../../../../src/core/domain/user/user.repository.js';

const activePlan = {
	id: 'plan-1',
	productId: 'prod-1',
	name: 'Basic',
	interval: 'MONTHLY',
	isActive: true,
	features: [],
	limits: {},
};

function setup(overrides: { plan?: unknown; existingUser?: unknown } = {}) {
	const tenantRepo = {
		create: vi.fn().mockResolvedValue({
			id: 'tenant-1',
			name: 'Nova Barbearia',
			slug: 'nova-barbearia-abcd',
		}),
	} as unknown as TenantRepository;

	const userRepo = {
		findByEmail: vi.fn().mockResolvedValue(overrides.existingUser ?? null),
		create: vi.fn().mockResolvedValue({ id: 'user-1' }),
	} as unknown as UserRepository;

	const planRepo = {
		findById: vi
			.fn()
			.mockResolvedValue(
				overrides.plan === undefined ? activePlan : overrides.plan,
			),
	} as unknown as PlanRepository;

	const subscriptionRepo = {
		create: vi.fn().mockResolvedValue({ id: 'sub-1', licenseKey: 'ABCD-1234' }),
	} as unknown as SubscriptionRepository;

	return { tenantRepo, userRepo, planRepo, subscriptionRepo };
}

describe('SelfServiceSignupUseCase', () => {
	it('rejeita quando faltam campos obrigatórios', async () => {
		const { tenantRepo, userRepo, planRepo, subscriptionRepo } = setup();
		const useCase = new SelfServiceSignupUseCase(
			tenantRepo,
			userRepo,
			planRepo,
			subscriptionRepo,
		);

		await expect(
			useCase.execute({ tenantName: '', email: 'a@a.com', planId: 'plan-1' }),
		).rejects.toThrow(ValidationError);
	});

	it('rejeita plano inexistente ou inativo', async () => {
		const { tenantRepo, userRepo, planRepo, subscriptionRepo } = setup({
			plan: { ...activePlan, isActive: false },
		});
		const useCase = new SelfServiceSignupUseCase(
			tenantRepo,
			userRepo,
			planRepo,
			subscriptionRepo,
		);

		await expect(
			useCase.execute({
				tenantName: 'Nova Barbearia',
				email: 'a@a.com',
				planId: 'plan-1',
			}),
		).rejects.toThrow(ValidationError);
	});

	it('cria tenant + user (se não existir) + subscription, retornando a licenseKey', async () => {
		const { tenantRepo, userRepo, planRepo, subscriptionRepo } = setup();
		const useCase = new SelfServiceSignupUseCase(
			tenantRepo,
			userRepo,
			planRepo,
			subscriptionRepo,
		);

		const result = await useCase.execute({
			tenantName: 'Nova Barbearia',
			email: 'dono@nova.com',
			planId: 'plan-1',
		});

		expect(tenantRepo.create).toHaveBeenCalled();
		expect(userRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'dono@nova.com',
				passwordHash: 'oauth-managed',
			}),
		);
		expect(subscriptionRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ tenantId: 'tenant-1', planId: 'plan-1' }),
		);
		expect(result.licenseKey).toBe('ABCD-1234');
	});

	it('não recria o usuário se o email já existe em outro tenant', async () => {
		const { tenantRepo, userRepo, planRepo, subscriptionRepo } = setup({
			existingUser: { id: 'user-existing' },
		});
		const useCase = new SelfServiceSignupUseCase(
			tenantRepo,
			userRepo,
			planRepo,
			subscriptionRepo,
		);

		await useCase.execute({
			tenantName: 'Nova Barbearia',
			email: 'ja-existe@nova.com',
			planId: 'plan-1',
		});

		expect(userRepo.create).not.toHaveBeenCalled();
	});
});
