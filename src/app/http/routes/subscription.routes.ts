import type { FastifyInstance } from 'fastify';
import {
	CancelSubscriptionUseCase,
	DeleteSubscriptionUseCase,
	GetSubscriptionUseCase,
	ListSubscriptionsUseCase,
	SelfServiceSignupUseCase,
} from '../../../core/application/use-cases/subscription.use-cases.js';
import type { AppContainer } from '../container.js';
import { NotFoundError } from '../errors/not-found-error.js';
import { requireOperator } from '../middlewares/require-operator.js';

export async function subscriptionRoutes(
	app: FastifyInstance,
	options: { container: AppContainer },
) {
	const { container } = options;

	// Público: self-service — novo tenant se cadastra num produto.
	app.post('/subscriptions', async (request, reply) => {
		const useCase = new SelfServiceSignupUseCase(
			container.tenantRepository,
			container.userRepository,
			container.planRepository,
			container.subscriptionRepository,
		);
		const result = await useCase.execute(request.body as never);
		return reply.send({ success: true, ...result });
	});

	app.register(async (operatorApp) => {
		operatorApp.addHook('preHandler', requireOperator);

		operatorApp.get('/subscriptions', async (request) => {
			const query = request.query as {
				page?: string;
				limit?: string;
				search?: string;
				productId?: string;
				status?: string;
			};
			return new ListSubscriptionsUseCase(
				container.subscriptionRepository,
			).execute({
				page: query.page ? Number(query.page) : 1,
				limit: query.limit ? Number(query.limit) : 10,
				search: query.search,
				productId: query.productId,
				status: query.status,
			});
		});

		operatorApp.get('/subscriptions/:id', async (request) => {
			const { id } = request.params as { id: string };
			const subscription = await new GetSubscriptionUseCase(
				container.subscriptionRepository,
			).execute(id);
			if (!subscription) throw new NotFoundError('Subscription not found');
			return subscription;
		});

		operatorApp.post('/subscriptions/:id/cancel', async (request) => {
			const { id } = request.params as { id: string };
			return new CancelSubscriptionUseCase(
				container.subscriptionRepository,
			).execute(id);
		});

		operatorApp.delete('/subscriptions/:id', async (request, reply) => {
			const { id } = request.params as { id: string };
			await new DeleteSubscriptionUseCase(
				container.subscriptionRepository,
			).execute(id);
			return reply.status(204).send();
		});
	});
}
