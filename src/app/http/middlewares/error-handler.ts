import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AiProviderUnavailableError } from '../../../core/application/use-cases/ai.use-cases.js';
import { AIClientError } from '../../../core/infra/ai/ai.client.js';
import { AppError } from '../errors/app-error.js';

export function errorHandler(
	error: FastifyError | AppError | Error,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	if (error instanceof AppError) {
		return reply.status(error.statusCode).send(error.toJSON());
	}

	if (error instanceof AiProviderUnavailableError) {
		return reply
			.status(503)
			.send({ error: 'ServiceUnavailable', message: error.message });
	}

	if (error instanceof AIClientError) {
		return reply
			.status(502)
			.send({ error: 'BadGateway', message: error.message });
	}

	if ('validation' in error && error.validation) {
		return reply
			.status(400)
			.send({ error: 'ValidationError', message: error.message });
	}

	request.log.error(error);
	return reply
		.status(500)
		.send({ error: 'InternalServerError', message: 'Internal server error' });
}
