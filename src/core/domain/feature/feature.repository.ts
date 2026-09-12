import type { Feature } from './feature.entity.js';

export interface CreateFeatureData {
	productId: string;
	key: string;
	name: string;
	description?: string;
}

export interface FeatureRepository {
	listByProduct(productId: string): Promise<Feature[]>;
	create(data: CreateFeatureData): Promise<Feature>;
	update(
		id: string,
		data: Partial<Omit<CreateFeatureData, 'productId'>>,
	): Promise<Feature>;
	delete(id: string): Promise<void>;
	/** Cria ou atualiza pelo par (productId, key) — usado no seed. */
	upsertByProductAndKey(
		productId: string,
		key: string,
		name: string,
	): Promise<Feature>;
}
