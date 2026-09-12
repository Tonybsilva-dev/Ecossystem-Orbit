import type { FastifyInstance } from 'fastify';
import {
	AddTenantSubscriptionUseCase,
	CreateTenantUseCase,
	GetTenantUseCase,
	ListTenantsUseCase,
	SearchTenantsUseCase,
	SetTenantStatusUseCase,
	SyncTenantUseCase,
	UpdateTenantUseCase,
} from '../../../core/application/use-cases/tenant.use-cases.js';
import { updateTenantSchema } from '../../../core/domain/tenant/tenant.schema.js';
import type { AppContainer } from '../container.js';
import { NotFoundError } from '../errors/not-found-error.js';
import { ValidationError } from '../errors/validation-error.js';
import { requireOperator } from '../middlewares/require-operator.js';

export async function tenantRoutes(
	app: FastifyInstance,
	options: { container: AppContainer },
) {
	const { container } = options;

	// Server-to-server: chamado pelo backend de cada tenant app no signup do
	// usuário (ex: barber-flow em databaseHooks.user.create). Protegido pelo
	// mesmo secret operador — só apps já provisionados o conhecem.
	app.post(
		'/tenants/sync',
		{ preHandler: requireOperator },
		async (request, reply) => {
			const body = request.body as { name?: string; email?: string };
			if (!body.name || !body.email) {
				throw new ValidationError('Missing required fields: name, email');
			}

			const useCase = new SyncTenantUseCase(
				container.tenantRepository,
				container.userRepository,
			);
			const tenant = await useCase.execute({
				name: body.name,
				email: body.email,
			});

			return reply.send({
				success: true,
				tenantId: tenant.id,
				slug: tenant.slug,
			});
		},
	);

	app.register(async (operatorApp) => {
		operatorApp.addHook('preHandler', requireOperator);

		operatorApp.get('/tenants', async () =>
			new ListTenantsUseCase(container.tenantRepository).execute(),
		);

		operatorApp.get('/tenants/search', async (request) => {
			const { query } = request.query as { query?: string };
			return new SearchTenantsUseCase(container.tenantRepository).execute(
				query ?? '',
			);
		});

		operatorApp.get('/tenants/:id', async (request) => {
			const { id } = request.params as { id: string };
			const tenant = await new GetTenantUseCase(
				container.tenantRepository,
			).execute(id);
			if (!tenant) throw new NotFoundError('Tenant not found');
			return tenant;
		});

		operatorApp.post('/tenants', async (request, reply) => {
			const useCase = new CreateTenantUseCase(
				container.tenantRepository,
				container.userRepository,
				container.subscriptionRepository,
				container.passwordHasher,
			);
			const tenant = await useCase.execute(request.body);
			return reply.status(201).send(tenant);
		});

		operatorApp.patch('/tenants/:id', async (request) => {
			const { id } = request.params as { id: string };
			const parsed = updateTenantSchema.safeParse(request.body);
			if (!parsed.success) {
				throw new ValidationError(
					parsed.error.errors[0]?.message ?? 'Dados inválidos',
				);
			}
			return new UpdateTenantUseCase(container.tenantRepository).execute(
				id,
				parsed.data,
			);
		});

		// Kill switch.
		operatorApp.post('/tenants/:id/status', async (request) => {
			const { id } = request.params as { id: string };
			const { status } = request.body as { status?: string };
			if (
				status !== 'ACTIVE' &&
				status !== 'INACTIVE' &&
				status !== 'PAST_DUE'
			) {
				throw new ValidationError(
					'status deve ser ACTIVE, INACTIVE ou PAST_DUE',
				);
			}
			return new SetTenantStatusUseCase(container.tenantRepository).execute(
				id,
				status,
			);
		});

		operatorApp.post('/tenants/:id/subscriptions', async (request, reply) => {
			const { id } = request.params as { id: string };
			const { planId } = request.body as { planId?: string };
			if (!planId) throw new ValidationError('planId é obrigatório');

			const useCase = new AddTenantSubscriptionUseCase(
				container.planRepository,
				container.subscriptionRepository,
			);
			const subscription = await useCase.execute(id, planId);
			return reply.status(201).send(subscription);
		});
	});
}
