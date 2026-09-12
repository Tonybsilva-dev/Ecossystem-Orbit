export interface Product {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	logo: string | null;
	apiKey: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductAnalytics {
	activeSubscribers: number;
	churnRate: number;
	mrr: string;
}
