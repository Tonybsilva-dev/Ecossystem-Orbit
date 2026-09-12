import { type AIClient, AIClientError } from '../../infra/ai/ai.client.js';

export interface GenerateCompletionInput {
	prompt: string;
	context?: Record<string, unknown>;
}

export class AiProviderUnavailableError extends Error {}

/**
 * `aiClient` é `null` quando nenhuma API key de provider está configurada —
 * o use-case decide o que fazer com isso (503), não o cliente HTTP.
 */
export class GenerateCompletionUseCase {
	constructor(private readonly aiClient: AIClient | null) {}

	async execute(input: GenerateCompletionInput): Promise<{ text: string }> {
		if (!this.aiClient) {
			throw new AiProviderUnavailableError(
				'AI providers not configured (OPENAI_API_KEY / GOOGLE_GEMINI_API_KEY)',
			);
		}

		try {
			const text = await this.aiClient.completion(input.prompt, input.context);
			return { text };
		} catch (error) {
			if (error instanceof AIClientError) throw error;
			throw error;
		}
	}
}
