import type { Plan } from '../plan/plan.entity.js';
import type { Product } from './product.entity.js';

export interface CreateProductData {
	name: string;
	slug: string;
	description?: string;
	logo?: string;
	apiKey?: string;
}

export interface ProductWithPlans extends Product {
	plans: Plan[];
}

export interface ProductRepository {
	findById(id: string): Promise<Product | null>;
	findBySlug(slug: string): Promise<Product | null>;
	findBySlugWithPlans(
		slug: string,
		includeInactive: boolean,
	): Promise<ProductWithPlans | null>;
	findByIdWithPlans(
		id: string,
		includeInactive: boolean,
	): Promise<ProductWithPlans | null>;
	list(): Promise<ProductWithPlans[]>;
	create(data: CreateProductData): Promise<Product>;
	update(id: string, data: Partial<CreateProductData>): Promise<Product>;
	delete(id: string): Promise<void>;
}
