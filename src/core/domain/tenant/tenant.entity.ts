export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'PAST_DUE';

export interface Tenant {
	id: string;
	name: string;
	slug: string;
	status: TenantStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface TenantOwner {
	id: string;
	email: string;
	name: string | null;
	role: string;
}

export interface TenantSubscriptionSummary {
	id: string;
	status: string;
	plan: {
		id: string;
		name: string;
		price: unknown;
		product: { id: string; name: string };
	};
}

/** Shape retornado por list/search — inclui o owner e as assinaturas pra UI admin. */
export interface TenantWithRelations extends Tenant {
	users: TenantOwner[];
	subscriptions: TenantSubscriptionSummary[];
}
