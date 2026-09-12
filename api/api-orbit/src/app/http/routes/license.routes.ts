import type { FastifyInstance } from 'fastify';
import { ValidateAccessUseCase } from '../../../core/application/use-cases/license.use-cases.js';
import type { AppContainer } from '../container.js';

const LICENSE_VALIDATION_CACHE_CONTROL =
	'public, max-age=600, stale-while-revalidate=3600';

export async function licenseRoutes(
	app: FastifyInstance,
	options: { container: AppContainer },
) {
	const { container } = options;

	app.get('/validate', async (request, reply) => {
		const { licenseKey } = request.query as { licenseKey?: string };
		const origin = request.headers.origin;

		if (!licenseKey) {
			return reply
				.status(400)
				.send({ error: 'Missing licenseKey query parameter' });
		}
		if (!origin) {
			return reply.status(400).send({ error: 'Missing Origin header' });
		}

		const result = await new ValidateAccessUseCase(
			container.subscriptionRepository,
		).execute({ licenseKey });

		if (result.valid) {
			return reply
				.header('Cache-Control', LICENSE_VALIDATION_CACHE_CONTROL)
				.status(200)
				.send({
					valid: true,
					capabilities: result.capabilities,
					limits: result.limits,
				});
		}

		return reply.status(403).send({ valid: false, capabilities: [] });
	});
}
