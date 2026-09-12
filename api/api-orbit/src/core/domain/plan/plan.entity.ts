export type PlanInterval = 'MONTHLY' | 'YEARLY';

export interface Plan {
	id: string;
	productId: string;
	name: string;
	price: unknown; // Prisma.Decimal — serializado como string via JSON
	interval: PlanInterval;
	features: string[];
	limits: unknown;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}
