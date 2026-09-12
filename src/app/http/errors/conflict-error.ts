import { AppError } from './app-error.js';

/**
 * Conflito de estado (ex: slug/email já em uso).
 * Status: 409 Conflict
 */
export class ConflictError extends AppError {
	constructor(
		message = 'Conflict',
		options?: { details?: unknown; cause?: Error },
	) {
		super(message, 409, 'ConflictError', options);
	}
}
