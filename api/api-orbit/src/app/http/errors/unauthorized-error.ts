import { AppError } from './app-error.js';

/**
 * Credenciais ausentes ou inválidas (operador ou login).
 * Status: 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
	constructor(
		message = 'Unauthorized',
		options?: { details?: unknown; cause?: Error },
	) {
		super(message, 401, 'UnauthorizedError', options);
	}
}
