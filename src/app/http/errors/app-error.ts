/**
 * Classe base para todos os erros da aplicação.
 * Fornece estrutura padronizada para erros HTTP.
 */
export abstract class AppError extends Error {
	public readonly statusCode: number;
	public readonly errorCode: string;
	public readonly details?: unknown;

	constructor(
		message: string,
		statusCode: number,
		errorCode: string,
		options?: { details?: unknown; cause?: Error },
	) {
		super(message, { cause: options?.cause });
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = options?.details;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	toJSON(): { error: string; message: string; details?: unknown } {
		const json: { error: string; message: string; details?: unknown } = {
			error: this.errorCode,
			message: this.message,
		};
		if (this.details) json.details = this.details;
		return json;
	}
}
