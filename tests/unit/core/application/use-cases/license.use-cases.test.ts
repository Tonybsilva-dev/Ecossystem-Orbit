import { describe, expect, it, vi } from 'vitest';
import { ValidateAccessUseCase } from '../../../../../src/core/application/use-cases/license.use-cases.js';
import type { SubscriptionWithRelations } from '../../../../../src/core/domain/subscription/subscription.entity.js';
import type { SubscriptionRepository } from '../../../../../src/core/domain/subscription/subscription.repository.js';

function makeSubscription(
	overrides: Partial<SubscriptionWithRelations> = {},
): SubscriptionWithRelations {
	return {
		id: 'sub-1',
		tenantId: 'tenant-1',
		planId: 'plan-1',
		licenseKey: 'LIC-1234',
		status: 'ACTIVE',
		expiresAt: null,
		canceledAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		tenant: { id: 'tenant-1', name: 'Acme', status: 'ACTIVE', features: [] },
		plan: {
			id: 'plan-1',
			name: 'Pro',
			price: '59.90',
			limits: { max_barbers: 10 },
			interval: 'MONTHLY',
			features: ['COUPONS'],
			product: { id: 'prod-1', name: 'BarberFlow' },
		},
		...overrides,
	};
}

function makeRepository(
	subscription: SubscriptionWithRelations | null,
): SubscriptionRepository {
	return {
		findByLicenseKeyWithFeatures: vi.fn().mockResolvedValue(subscription),
	} as unknown as SubscriptionRepository;
}

describe('ValidateAccessUseCase', () => {
	it('retorna inválido quando a licença não existe', async () => {
		const useCase = new ValidateAccessUseCase(makeRepository(null));
		const result = await useCase.execute({ licenseKey: 'NAO-EXISTE' });
		expect(result).toEqual({ valid: false, capabilities: [] });
	});

	it('retorna inválido quando a assinatura está cancelada', async () => {
		const useCase = new ValidateAccessUseCase(
			makeRepository(makeSubscription({ status: 'CANCELED' })),
		);
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });
		expect(result.valid).toBe(false);
	});

	it('retorna inválido quando o tenant está INACTIVE (kill switch)', async () => {
		const subscription = makeSubscription({
			tenant: {
				id: 'tenant-1',
				name: 'Acme',
				status: 'INACTIVE',
				features: [],
			},
		});
		const useCase = new ValidateAccessUseCase(makeRepository(subscription));
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });
		expect(result).toEqual({ valid: false, capabilities: [] });
	});

	it('combina features do plano com overrides do tenant, sem duplicatas', async () => {
		const subscription = makeSubscription({
			tenant: {
				id: 'tenant-1',
				name: 'Acme',
				status: 'ACTIVE',
				features: [{ feature: 'COUPONS' }, { feature: 'WHATSAPP' }],
			},
		});
		const useCase = new ValidateAccessUseCase(makeRepository(subscription));
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });

		expect(result.valid).toBe(true);
		expect(result.capabilities.sort()).toEqual(['COUPONS', 'WHATSAPP']);
		expect(result.limits).toEqual({ max_barbers: 10 });
	});

	it('aceita assinatura em TRIAL como válida', async () => {
		const useCase = new ValidateAccessUseCase(
			makeRepository(makeSubscription({ status: 'TRIAL' })),
		);
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });
		expect(result.valid).toBe(true);
	});
});
