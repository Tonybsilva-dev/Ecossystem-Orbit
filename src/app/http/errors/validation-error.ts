import type { ZodError } from 'zod';
import { AppError } from './app-error.js';

export interface ValidationErrorDetail {
	field: string;
	message: string;
	code?: string;
}

/**
 * Erro de validação (schemas Zod ou regras de input).
 * Status: 400 Bad Request
 */
export class ValidationError extends AppError {
	constructor(
		message: string,
		options?: { details?: ValidationErrorDetail[]; cause?: Error },
	) {
		super(message, 400, 'ValidationError', options);
	}

	static fromZodError(zodError: ZodError): ValidationError {
		const details: ValidationErrorDetail[] = zodError.issues.map((issue) => ({
			field: issue.path.join('.'),
			message: issue.message,
			code: issue.code,
		}));

		const message =
			details.length === 1
				? details[0].message
				: `Erro de validação em ${details.length} campo(s)`;

		return new ValidationError(message, { details, cause: zodError });
	}
}
