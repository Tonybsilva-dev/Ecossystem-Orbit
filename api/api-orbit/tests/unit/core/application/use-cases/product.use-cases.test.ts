import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../../../../src/app/http/errors/validation-error.js';
import {
	DeleteProductUseCase,
	GetProductAnalyticsUseCase,
} from '../../../../../src/core/application/use-cases/product.use-cases.js';
import type { ProductRepository } from '../../../../../src/core/domain/product/product.repository.js';
import type { SubscriptionRepository } from '../../../../../src/core/domain/subscription/subscription.repository.js';

describe('DeleteProductUseCase', () => {
	it('recusa deletar produto com assinaturas ativas', async () => {
		const productRepo = { delete: vi.fn() } as unknown as ProductRepository;
		const subscriptionRepo = {
			countByProductAndStatus: vi.fn().mockResolvedValue(3),
		} as unknown as SubscriptionRepository;

		const useCase = new DeleteProductUseCase(productRepo, subscriptionRepo);

		await expect(useCase.execute('prod-1')).rejects.toThrow(ValidationError);
		expect(productRepo.delete).not.toHaveBeenCalled();
	});

	it('deleta quando não há assinaturas ativas', async () => {
		const productRepo = { delete: vi.fn() } as unknown as ProductRepository;
		const subscriptionRepo = {
			countByProductAndStatus: vi.fn().mockResolvedValue(0),
		} as unknown as SubscriptionRepository;

		const useCase = new DeleteProductUseCase(productRepo, subscriptionRepo);
		await useCase.execute('prod-1');

		expect(productRepo.delete).toHaveBeenCalledWith('prod-1');
	});
});

describe('GetProductAnalyticsUseCase', () => {
	it('calcula MRR normalizando planos anuais pra mensal', async () => {
		const subscriptionRepo = {
			countByProductAndStatus: vi
				.fn()
				.mockImplementation((_id, status) => (status === 'ACTIVE' ? 2 : 1)),
			listActiveByProduct: vi
				.fn()
				.mockResolvedValue([
					{ plan: { price: '100', interval: 'MONTHLY' } },
					{ plan: { price: '1200', interval: 'YEARLY' } },
				]),
		} as unknown as SubscriptionRepository;

		const useCase = new GetProductAnalyticsUseCase(subscriptionRepo);
		const result = await useCase.execute('prod-1');

		expect(result.activeSubscribers).toBe(2);
		expect(result.mrr).toBe('200.00'); // 100 + (1200/12)
		expect(result.churnRate).toBeCloseTo((1 / 3) * 100);
	});

	it('não divide por zero quando não há assinantes nem churn', async () => {
		const subscriptionRepo = {
			countByProductAndStatus: vi.fn().mockResolvedValue(0),
			listActiveByProduct: vi.fn().mockResolvedValue([]),
		} as unknown as SubscriptionRepository;

		const useCase = new GetProductAnalyticsUseCase(subscriptionRepo);
		const result = await useCase.execute('prod-1');

		expect(result.churnRate).toBe(0);
		expect(result.mrr).toBe('0.00');
	});
});
