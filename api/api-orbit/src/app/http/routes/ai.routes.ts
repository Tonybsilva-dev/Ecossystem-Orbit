import type { FastifyInstance } from 'fastify';
import { GenerateCompletionUseCase } from '../../../core/application/use-cases/ai.use-cases.js';
import type { AppContainer } from '../container.js';
import { ValidationError } from '../errors/validation-error.js';
import { requireOperator } from '../middlewares/require-operator.js';

export async function aiRoutes(
	app: FastifyInstance,
	options: { container: AppContainer },
) {
	const { container } = options;

	app.register(async (operatorApp) => {
		operatorApp.addHook('preHandler', requireOperator);

		operatorApp.post('/ai/completion', async (request, reply) => {
			const body = request.body as {
				prompt?: string;
				context?: Record<string, unknown>;
			};
			if (!body.prompt) throw new ValidationError('prompt é obrigatório');

			const useCase = new GenerateCompletionUseCase(container.aiClient);
			const result = await useCase.execute({
				prompt: body.prompt,
				context: body.context,
			});
			return reply.send(result);
		});
	});
}
