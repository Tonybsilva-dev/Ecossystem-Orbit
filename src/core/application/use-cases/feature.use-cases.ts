import { ValidationError } from '../../../app/http/errors/validation-error.js';
import type { Feature } from '../../domain/feature/feature.entity.js';
import type {
	CreateFeatureData,
	FeatureRepository,
} from '../../domain/feature/feature.repository.js';

export class ListFeaturesUseCase {
	constructor(private readonly featureRepository: FeatureRepository) {}

	async execute(productId: string): Promise<Feature[]> {
		return this.featureRepository.listByProduct(productId);
	}
}

export class CreateFeatureUseCase {
	constructor(private readonly featureRepository: FeatureRepository) {}

	async execute(data: CreateFeatureData): Promise<Feature> {
		if (!data.key || !data.name)
			throw new ValidationError('key e name são obrigatórios');
		return this.featureRepository.create(data);
	}
}

export class UpdateFeatureUseCase {
	constructor(private readonly featureRepository: FeatureRepository) {}

	async execute(
		id: string,
		data: Partial<Omit<CreateFeatureData, 'productId'>>,
	): Promise<Feature> {
		return this.featureRepository.update(id, data);
	}
}

export class DeleteFeatureUseCase {
	constructor(private readonly featureRepository: FeatureRepository) {}

	async execute(id: string): Promise<void> {
		return this.featureRepository.delete(id);
	}
}
