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

export interface TenantSubscriptionDetail {
	id: string;
	status: string;
	licenseKey: string;
	expiresAt: Date | null;
	canceledAt: Date | null;
	createdAt: Date;
	plan: {
		id: string;
		name: string;
		price: unknown;
		interval: string;
		product: { id: string; name: string };
	};
}

/**
 * Shape completo pra página de detalhe do tenant: TODOS os usuários (não só
 * o owner) e TODAS as assinaturas (histórico completo, não só a ativa) —
 * é o que permite o operador ver de cara se o tenant está com identidade
 * quebrada (ex: sem usuário nenhum, ou sem assinatura ativa nenhuma).
 */
export interface TenantDetail extends Tenant {
	users: TenantOwner[];
	subscriptions: TenantSubscriptionDetail[];
}
