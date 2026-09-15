import type { FastifyInstance } from 'fastify';
import {
	AddTenantSubscriptionUseCase,
	CreateTenantUseCase,
	GetTenantDetailUseCase,
	ListTenantsUseCase,
	SearchTenantsUseCase,
	SetTenantStatusUseCase,
	SyncTenantUseCase,
	UpdateTenantUseCase,
} from '../../../core/application/use-cases/tenant.use-cases.js';
import { updateTenantSchema } from '../../../core/domain/tenant/tenant.schema.js';
import { generateTenantsReportPdf } from '../../../core/infra/pdf/tenants-report.pdf.js';
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

		operatorApp.get('/tenants', async (request) => {
			const { productId, planId, search } = request.query as {
				productId?: string;
				planId?: string;
				search?: string;
			};
			return new ListTenantsUseCase(container.tenantRepository).execute({
				productId,
				planId,
				search,
			});
		});

		// Relatório em PDF por tenant (agrupa todos os produtos/planos daquele
		// tenant numa linha) — mesmos filtros da listagem, sem paginação.
		operatorApp.get('/tenants/export.pdf', async (request, reply) => {
			const query = request.query as {
				productId?: string;
				planId?: string;
				search?: string;
			};

			const tenants = await new ListTenantsUseCase(
				container.tenantRepository,
			).execute(query);

			let productName: string | undefined;
			let planName: string | undefined;
			if (query.productId) {
				const product = await container.productRepository.findById(
					query.productId,
				);
				productName = product?.name;
			}
			if (query.planId) {
				const plan = await container.planRepository.findById(query.planId);
				planName = plan?.name;
			}

			const pdf = await generateTenantsReportPdf(tenants, {
				search: query.search,
				productName,
				planName,
			});

			return reply
				.header('Content-Type', 'application/pdf')
				.header(
					'Content-Disposition',
					`attachment; filename="tenants-${new Date().toISOString().slice(0, 10)}.pdf"`,
				)
				.send(pdf);
		});

		operatorApp.get('/tenants/search', async (request) => {
			const { query } = request.query as { query?: string };
			return new SearchTenantsUseCase(container.tenantRepository).execute(
				query ?? '',
			);
		});

		// Página de detalhe do tenant no admin: usuários + histórico completo
		// de assinaturas (não só a ativa) — usado pra decidir todas as ações
		// (trocar plano, cancelar, kill switch) num lugar só.
		operatorApp.get('/tenants/:id', async (request) => {
			const { id } = request.params as { id: string };
			const tenant = await new GetTenantDetailUseCase(
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
