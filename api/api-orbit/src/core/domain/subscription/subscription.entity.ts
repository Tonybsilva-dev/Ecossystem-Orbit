export type SubStatus =
	| 'ACTIVE'
	| 'EXPIRED'
	| 'CANCELED'
	| 'TRIAL'
	| 'PAST_DUE';

export interface Subscription {
	id: string;
	tenantId: string;
	planId: string;
	licenseKey: string;
	status: SubStatus;
	expiresAt: Date | null;
	canceledAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface SubscriptionWithRelations extends Subscription {
	tenant: {
		id: string;
		name: string;
		status: string;
		features?: { feature: string }[];
	};
	plan: {
		id: string;
		name: string;
		price: unknown;
		limits: unknown;
		interval: string;
		features: string[];
		product: { id: string; name: string };
	};
}
