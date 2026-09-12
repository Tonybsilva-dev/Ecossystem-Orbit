import { describe, expect, it, vi } from 'vitest';
import {
	AiProviderUnavailableError,
	GenerateCompletionUseCase,
} from '../../../../../src/core/application/use-cases/ai.use-cases.js';
import type { AIClient } from '../../../../../src/core/infra/ai/ai.client.js';

describe('GenerateCompletionUseCase', () => {
	it('lança AiProviderUnavailableError quando nenhum provider está configurado', async () => {
		const useCase = new GenerateCompletionUseCase(null);
		await expect(useCase.execute({ prompt: 'oi' })).rejects.toThrow(
			AiProviderUnavailableError,
		);
	});

	it('retorna o texto gerado pelo client', async () => {
		const client = {
			completion: vi.fn().mockResolvedValue('resposta gerada'),
		} as unknown as AIClient;
		const useCase = new GenerateCompletionUseCase(client);

		const result = await useCase.execute({
			prompt: 'oi',
			context: { userId: '1' },
		});

		expect(result).toEqual({ text: 'resposta gerada' });
		expect(client.completion).toHaveBeenCalledWith('oi', { userId: '1' });
	});
});
