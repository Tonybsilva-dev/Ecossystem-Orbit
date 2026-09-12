import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../../../../src/app/http/errors/validation-error.js';
import {
	CreateFeatureUseCase,
	DeleteFeatureUseCase,
	ListFeaturesUseCase,
	UpdateFeatureUseCase,
} from '../../../../../src/core/application/use-cases/feature.use-cases.js';
import type { FeatureRepository } from '../../../../../src/core/domain/feature/feature.repository.js';

function makeRepo(
	overrides: Partial<FeatureRepository> = {},
): FeatureRepository {
	return {
		listByProduct: vi.fn().mockResolvedValue([]),
		create: vi.fn().mockResolvedValue({ id: 'feat-1' }),
		update: vi.fn().mockResolvedValue({ id: 'feat-1' }),
		delete: vi.fn(),
		upsertByProductAndKey: vi.fn(),
		...overrides,
	};
}

describe('CreateFeatureUseCase', () => {
	it('rejeita quando falta key ou name', async () => {
		const repo = makeRepo();
		const useCase = new CreateFeatureUseCase(repo);

		await expect(
			useCase.execute({ productId: 'p1', key: '', name: 'Cupons' }),
		).rejects.toThrow(ValidationError);
		expect(repo.create).not.toHaveBeenCalled();
	});

	it('cria a feature quando válida', async () => {
		const repo = makeRepo();
		const useCase = new CreateFeatureUseCase(repo);

		const result = await useCase.execute({
			productId: 'p1',
			key: 'COUPONS',
			name: 'Cupons',
		});
		expect(result).toEqual({ id: 'feat-1' });
	});
});

describe('ListFeaturesUseCase / UpdateFeatureUseCase / DeleteFeatureUseCase', () => {
	it('listam, atualizam e deletam delegando pro repositório', async () => {
		const repo = makeRepo();

		await new ListFeaturesUseCase(repo).execute('p1');
		expect(repo.listByProduct).toHaveBeenCalledWith('p1');

		await new UpdateFeatureUseCase(repo).execute('feat-1', {
			name: 'Novo nome',
		});
		expect(repo.update).toHaveBeenCalledWith('feat-1', { name: 'Novo nome' });

		await new DeleteFeatureUseCase(repo).execute('feat-1');
		expect(repo.delete).toHaveBeenCalledWith('feat-1');
	});
});
