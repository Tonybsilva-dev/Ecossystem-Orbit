import { describe, expect, it, vi } from 'vitest';
import { ValidateAccessUseCase } from '../../../../../src/core/application/use-cases/license.use-cases.js';
import type { BannerRepository } from '../../../../../src/core/domain/banner/banner.repository.js';
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
			includedFeatures: [],
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

function makeBannerRepository(banners: { id: string; type: string; message: string; link: string | null }[] = []): BannerRepository {
	return {
		findActiveFor: vi.fn().mockResolvedValue(banners),
	} as unknown as BannerRepository;
}

describe('ValidateAccessUseCase', () => {
	it('retorna inválido quando a licença não existe', async () => {
		const useCase = new ValidateAccessUseCase(
			makeRepository(null),
			makeBannerRepository(),
		);
		const result = await useCase.execute({ licenseKey: 'NAO-EXISTE' });
		expect(result.valid).toBe(false);
		expect(result.reason).toBe('LICENSE_NOT_FOUND');
		expect(result.capabilities).toEqual([]);
		expect(result.banners).toEqual([]);
	});

	it('retorna inválido quando a assinatura está cancelada', async () => {
		const useCase = new ValidateAccessUseCase(
			makeRepository(makeSubscription({ status: 'CANCELED' })),
			makeBannerRepository(),
		);
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });
		expect(result.valid).toBe(false);
		expect(result.reason).toBe('SUBSCRIPTION_INACTIVE');
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
		const useCase = new ValidateAccessUseCase(
			makeRepository(subscription),
			makeBannerRepository(),
		);
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });
		expect(result.valid).toBe(false);
		expect(result.reason).toBe('TENANT_SUSPENDED');
		expect(result.capabilities).toEqual([]);
	});

	it('combina features da relação includedFeatures, do array legado e overrides do tenant, sem duplicatas', async () => {
		const subscription = makeSubscription({
			tenant: {
				id: 'tenant-1',
				name: 'Acme',
				status: 'ACTIVE',
				features: [{ feature: 'COUPONS' }, { feature: 'WHATSAPP' }],
			},
			plan: {
				id: 'plan-1',
				name: 'Pro',
				price: '59.90',
				limits: { max_barbers: 10 },
				interval: 'MONTHLY',
				features: ['COUPONS'],
				product: { id: 'prod-1', name: 'BarberFlow' },
				includedFeatures: [{ key: 'dashboard' }, { key: 'financial' }],
			},
		});
		const useCase = new ValidateAccessUseCase(
			makeRepository(subscription),
			makeBannerRepository(),
		);
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });

		expect(result.valid).toBe(true);
		expect(result.capabilities.sort()).toEqual(
			['COUPONS', 'WHATSAPP', 'dashboard', 'financial'].sort(),
		);
		expect(result.limits).toEqual({ max_barbers: 10 });
	});

	it('aceita assinatura em TRIAL como válida', async () => {
		const useCase = new ValidateAccessUseCase(
			makeRepository(makeSubscription({ status: 'TRIAL' })),
			makeBannerRepository(),
		);
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });
		expect(result.valid).toBe(true);
	});

	it('remove da lista de capabilities qualquer feature com kill switch global (isEnabled=false), mesmo vinda do plano ou de override do tenant', async () => {
		const subscription = makeSubscription({
			tenant: {
				id: 'tenant-1',
				name: 'Acme',
				status: 'ACTIVE',
				features: [{ feature: 'whatsapp' }],
			},
			plan: {
				id: 'plan-1',
				name: 'Pro',
				price: '59.90',
				limits: { max_barbers: 10 },
				interval: 'MONTHLY',
				features: [],
				product: {
					id: 'prod-1',
					name: 'BarberFlow',
					features: [
						{ key: 'financial', isEnabled: true },
						{ key: 'whatsapp', isEnabled: false },
					],
				},
				includedFeatures: [{ key: 'financial' }, { key: 'whatsapp' }],
			},
		});
		const useCase = new ValidateAccessUseCase(
			makeRepository(subscription),
			makeBannerRepository(),
		);
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });

		expect(result.valid).toBe(true);
		expect(result.capabilities).toEqual(['financial']);
	});

	it('inclui os banners vigentes do produto/tenant tanto no caminho válido quanto no bloqueado', async () => {
		const banners = [{ id: 'b1', type: 'WARNING', message: 'Fatura vence em 3 dias', link: null }];
		const useCase = new ValidateAccessUseCase(
			makeRepository(makeSubscription()),
			makeBannerRepository(banners),
		);
		const result = await useCase.execute({ licenseKey: 'LIC-1234' });
		expect(result.banners).toEqual(banners);
	});
});
