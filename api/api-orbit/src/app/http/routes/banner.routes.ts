import type { FastifyInstance } from 'fastify';
import {
	CreateBannerUseCase,
	DeleteBannerUseCase,
	ListBannersUseCase,
	UpdateBannerUseCase,
} from '../../../core/application/use-cases/banner.use-cases.js';
import type { AppContainer } from '../container.js';
import { requireOperator } from '../middlewares/require-operator.js';

export async function bannerRoutes(
	app: FastifyInstance,
	options: { container: AppContainer },
) {
	const { container } = options;

	app.register(async (operatorApp) => {
		operatorApp.addHook('preHandler', requireOperator);

		operatorApp.get('/banners', async () =>
			new ListBannersUseCase(container.bannerRepository).execute(),
		);

		operatorApp.post('/banners', async (request, reply) => {
			const body = request.body as {
				productId?: string | null;
				tenantId?: string | null;
				type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'UPDATE';
				message?: string;
				link?: string | null;
				isActive?: boolean;
				startsAt?: string | null;
				endsAt?: string | null;
			};
			const banner = await new CreateBannerUseCase(
				container.bannerRepository,
			).execute({
				productId: body.productId || null,
				tenantId: body.tenantId || null,
				type: body.type,
				message: body.message ?? '',
				link: body.link || null,
				isActive: body.isActive,
				startsAt: body.startsAt ? new Date(body.startsAt) : null,
				endsAt: body.endsAt ? new Date(body.endsAt) : null,
			});
			return reply.status(201).send(banner);
		});

		operatorApp.patch('/banners/:id', async (request) => {
			const { id } = request.params as { id: string };
			const body = request.body as {
				productId?: string | null;
				tenantId?: string | null;
				type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'UPDATE';
				message?: string;
				link?: string | null;
				isActive?: boolean;
				startsAt?: string | null;
				endsAt?: string | null;
			};
			return new UpdateBannerUseCase(container.bannerRepository).execute(id, {
				...body,
				startsAt:
					body.startsAt !== undefined
						? body.startsAt
							? new Date(body.startsAt)
							: null
						: undefined,
				endsAt:
					body.endsAt !== undefined
						? body.endsAt
							? new Date(body.endsAt)
							: null
						: undefined,
			});
		});

		operatorApp.delete('/banners/:id', async (request, reply) => {
			const { id } = request.params as { id: string };
			await new DeleteBannerUseCase(container.bannerRepository).execute(id);
			return reply.status(204).send();
		});
	});
}
