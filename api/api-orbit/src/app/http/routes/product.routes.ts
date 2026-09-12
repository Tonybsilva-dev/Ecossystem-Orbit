import type { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import {
	CreateFeatureUseCase,
	DeleteFeatureUseCase,
	ListFeaturesUseCase,
	UpdateFeatureUseCase,
} from '../../../core/application/use-cases/feature.use-cases.js';
import {
	CreatePlanUseCase,
	DeletePlanUseCase,
	UpdatePlanUseCase,
} from '../../../core/application/use-cases/plan.use-cases.js';
import {
	CreateProductUseCase,
	DeleteProductUseCase,
	GetProductAnalyticsUseCase,
	GetProductBySlugUseCase,
	GetProductFullUseCase,
	ListProductsUseCase,
	UpdateProductUseCase,
} from '../../../core/application/use-cases/product.use-cases.js';
import type { AppContainer } from '../container.js';
import { NotFoundError } from '../errors/not-found-error.js';
import { ValidationError } from '../errors/validation-error.js';
import { requireOperator } from '../middlewares/require-operator.js';

export async function productRoutes(
	app: FastifyInstance,
	options: { container: AppContainer },
) {
	const { container } = options;

	// Público: consumido pelos tenant apps para exibir planos (ex: onboarding do barber-flow).
	app.get('/products/:slug', async (request) => {
		const { slug } = request.params as { slug: string };
		const product = await new GetProductBySlugUseCase(
			container.productRepository,
		).execute(slug);
		if (!product) throw new NotFoundError('Product not found');
		return product;
	});

	app.register(async (operatorApp) => {
		operatorApp.addHook('preHandler', requireOperator);

		operatorApp.get('/products', async () =>
			new ListProductsUseCase(container.productRepository).execute(),
		);

		// Aceita slug ou id — admin UI usa o mesmo param pros dois casos.
		operatorApp.get('/products/:id/full', async (request) => {
			const { id } = request.params as { id: string };
			const product = await new GetProductFullUseCase(
				container.productRepository,
			).execute(id);
			if (!product) throw new NotFoundError('Product not found');
			return product;
		});

		operatorApp.post('/products', async (request, reply) => {
			const body = request.body as {
				name?: string;
				slug?: string;
				description?: string;
				logo?: string;
			};
			if (!body.name || !body.slug)
				throw new ValidationError('name e slug são obrigatórios');
			const product = await new CreateProductUseCase(
				container.productRepository,
			).execute({
				name: body.name,
				slug: body.slug,
				description: body.description,
				logo: body.logo,
			});
			return reply.status(201).send(product);
		});

		operatorApp.patch('/products/:id', async (request) => {
			const { id } = request.params as { id: string };
			return new UpdateProductUseCase(container.productRepository).execute(
				id,
				request.body as Record<string, unknown>,
			);
		});

		operatorApp.delete('/products/:id', async (request, reply) => {
			const { id } = request.params as { id: string };
			await new DeleteProductUseCase(
				container.productRepository,
				container.subscriptionRepository,
			).execute(id);
			return reply.status(204).send();
		});

		operatorApp.get('/products/:id/analytics', async (request) => {
			const { id } = request.params as { id: string };
			return new GetProductAnalyticsUseCase(
				container.subscriptionRepository,
			).execute(id);
		});

		// Plans
		operatorApp.post('/products/:id/plans', async (request, reply) => {
			const { id } = request.params as { id: string };
			const body = request.body as {
				name?: string;
				price?: number;
				interval?: 'MONTHLY' | 'YEARLY';
				features?: string[];
				limits?: Prisma.InputJsonValue;
				featureIds?: string[];
			};
			if (!body.name || body.price === undefined || !body.interval) {
				throw new ValidationError('name, price e interval são obrigatórios');
			}
			const plan = await new CreatePlanUseCase(
				container.planRepository,
			).execute({
				productId: id,
				name: body.name,
				price: body.price,
				interval: body.interval,
				features: body.features ?? [],
				limits: body.limits,
				featureIds: body.featureIds,
			});
			return reply.status(201).send(plan);
		});

		operatorApp.patch('/plans/:id', async (request) => {
			const { id } = request.params as { id: string };
			return new UpdatePlanUseCase(container.planRepository).execute(
				id,
				request.body as Record<string, unknown>,
			);
		});

		operatorApp.delete('/plans/:id', async (request, reply) => {
			const { id } = request.params as { id: string };
			const result = await new DeletePlanUseCase(
				container.planRepository,
			).execute(id);
			return reply.status(200).send(result);
		});

		// Features
		operatorApp.get('/products/:id/features', async (request) => {
			const { id } = request.params as { id: string };
			return new ListFeaturesUseCase(container.featureRepository).execute(id);
		});

		operatorApp.post('/products/:id/features', async (request, reply) => {
			const { id } = request.params as { id: string };
			const body = request.body as {
				key?: string;
				name?: string;
				description?: string;
			};
			if (!body.key || !body.name)
				throw new ValidationError('key e name são obrigatórios');
			const feature = await new CreateFeatureUseCase(
				container.featureRepository,
			).execute({
				productId: id,
				key: body.key,
				name: body.name,
				description: body.description,
			});
			return reply.status(201).send(feature);
		});

		operatorApp.patch('/features/:id', async (request) => {
			const { id } = request.params as { id: string };
			return new UpdateFeatureUseCase(container.featureRepository).execute(
				id,
				request.body as Record<string, unknown>,
			);
		});

		operatorApp.delete('/features/:id', async (request, reply) => {
			const { id } = request.params as { id: string };
			await new DeleteFeatureUseCase(container.featureRepository).execute(id);
			return reply.status(204).send();
		});
	});
}
