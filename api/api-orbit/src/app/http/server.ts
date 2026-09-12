import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyError } from 'fastify';
import { prisma } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { AppContainer } from './container.js';
import type { AppError } from './errors/app-error.js';
import { errorHandler } from './middlewares/error-handler.js';
import { aiRoutes } from './routes/ai.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { licenseRoutes } from './routes/license.routes.js';
import { productRoutes } from './routes/product.routes.js';
import { subscriptionRoutes } from './routes/subscription.routes.js';
import { tenantRoutes } from './routes/tenant.routes.js';

export async function build() {
	const app = Fastify({ logger: true });
	const container = new AppContainer(prisma);

	await app.register(helmet);
	await app.register(cors, {
		origin: true,
		methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
	});
	await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

	app.get('/', async () => ({ service: 'api-orbit', status: 'ok' }));

	await app.register(licenseRoutes, { container });
	await app.register(productRoutes, { container });
	await app.register(subscriptionRoutes, { container });
	await app.register(tenantRoutes, { container });
	await app.register(aiRoutes, { container });
	await app.register(authRoutes, { container });

	app.setErrorHandler((error: FastifyError | AppError, request, reply) =>
		errorHandler(error, request, reply),
	);

	return app;
}

export async function start() {
	const app = await build();
	try {
		await app.listen({ port: env.PORT, host: env.HOST });
		app.log.info(`api-orbit listening on ${env.HOST}:${env.PORT}`);
	} catch (error) {
		app.log.error(error);
		process.exit(1);
	}
}
