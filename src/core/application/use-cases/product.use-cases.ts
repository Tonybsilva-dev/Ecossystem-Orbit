import { ValidationError } from '../../../app/http/errors/validation-error.js';
import type {
	Product,
	ProductAnalytics,
} from '../../domain/product/product.entity.js';
import type {
	CreateProductData,
	ProductRepository,
	ProductWithPlans,
} from '../../domain/product/product.repository.js';
import type { SubscriptionRepository } from '../../domain/subscription/subscription.repository.js';

export class ListProductsUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	async execute(): Promise<ProductWithPlans[]> {
		return this.productRepository.list();
	}
}

/** Público — só planos ativos. Usado pelos tenant apps no onboarding. */
export class GetProductBySlugUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	async execute(slug: string): Promise<ProductWithPlans | null> {
		return this.productRepository.findBySlugWithPlans(slug, false);
	}
}

/** Operador — inclui planos inativos. Aceita slug ou id (mesmo param na UI admin). */
export class GetProductFullUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	async execute(idOrSlug: string): Promise<ProductWithPlans | null> {
		const bySlug = await this.productRepository.findBySlugWithPlans(
			idOrSlug,
			true,
		);
		if (bySlug) return bySlug;
		return this.productRepository.findByIdWithPlans(idOrSlug, true);
	}
}

export class CreateProductUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	async execute(data: CreateProductData): Promise<Product> {
		if (!data.name || !data.slug)
			throw new ValidationError('name e slug são obrigatórios');
		return this.productRepository.create(data);
	}
}

export class UpdateProductUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	async execute(
		id: string,
		data: Partial<CreateProductData>,
	): Promise<Product> {
		return this.productRepository.update(id, data);
	}
}

export class DeleteProductUseCase {
	constructor(
		private readonly productRepository: ProductRepository,
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(id: string): Promise<void> {
		const activeSubs =
			await this.subscriptionRepository.countByProductAndStatus(id, 'ACTIVE');
		if (activeSubs > 0)
			throw new ValidationError(
				'Cannot delete product with active subscriptions.',
			);
		await this.productRepository.delete(id);
	}
}

export class GetProductAnalyticsUseCase {
	constructor(
		private readonly subscriptionRepository: SubscriptionRepository,
	) {}

	async execute(productId: string): Promise<ProductAnalytics> {
		const [activeSubs, churnedSubs, activeSubscriptions] = await Promise.all([
			this.subscriptionRepository.countByProductAndStatus(productId, 'ACTIVE'),
			this.subscriptionRepository.countByProductAndStatus(
				productId,
				'CANCELED',
			),
			this.subscriptionRepository.listActiveByProduct(productId),
		]);

		const mrr = activeSubscriptions.reduce((acc, sub) => {
			const price = Number(sub.plan.price);
			return acc + (sub.plan.interval === 'YEARLY' ? price / 12 : price);
		}, 0);

		return {
			activeSubscribers: activeSubs,
			churnRate:
				activeSubs + churnedSubs > 0
					? (churnedSubs / (activeSubs + churnedSubs)) * 100
					: 0,
			mrr: mrr.toFixed(2),
		};
	}
}
