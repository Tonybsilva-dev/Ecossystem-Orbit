import { AppError } from './app-error.js';

/**
 * Erro quando recurso não é encontrado.
 * Status: 404 Not Found
 */
export class NotFoundError extends AppError {
	constructor(
		message = 'Recurso não encontrado',
		options?: { details?: unknown; cause?: Error },
	) {
		super(message, 404, 'NotFoundError', options);
	}
}
