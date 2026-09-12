import type { Plan, PlanInterval } from './plan.entity.js';

export interface CreatePlanData {
	productId: string;
	name: string;
	price: number;
	interval: PlanInterval;
	features: string[];
	limits?: unknown;
	featureIds?: string[];
}

export interface UpdatePlanData {
	name?: string;
	price?: number;
	interval?: PlanInterval;
	features?: string[];
	isActive?: boolean;
	limits?: unknown;
	featureIds?: string[];
}

export interface PlanWithProduct extends Plan {
	product: { id: string };
}

export interface PlanRepository {
	findById(id: string): Promise<PlanWithProduct | null>;
	findFirstByProductAndName(
		productId: string,
		name: string,
	): Promise<Plan | null>;
	create(data: CreatePlanData): Promise<Plan>;
	update(id: string, data: UpdatePlanData): Promise<Plan>;
	/** Some com data.isActive:false se houver assinaturas ativas; deleta se não houver. */
	deleteOrDeactivate(id: string): Promise<Plan | { deleted: true }>;
	countSubscriptions(id: string): Promise<number>;
}
