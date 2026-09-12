import type {
	SubStatus,
	Subscription,
	SubscriptionWithRelations,
} from './subscription.entity.js';

export interface CreateSubscriptionData {
	tenantId: string;
	planId: string;
	licenseKey: string;
	status?: SubStatus;
	expiresAt?: Date;
}

export interface ListSubscriptionsParams {
	page: number;
	limit: number;
	search?: string;
	productId?: string;
	status?: string;
}

export interface ListSubscriptionsResult {
	subscriptions: SubscriptionWithRelations[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface SubscriptionRepository {
	findById(id: string): Promise<SubscriptionWithRelations | null>;
	findByLicenseKey(
		licenseKey: string,
	): Promise<SubscriptionWithRelations | null>;
	/** Inclui tenant.features (overrides) — usado só na validação de licença. */
	findByLicenseKeyWithFeatures(
		licenseKey: string,
	): Promise<SubscriptionWithRelations | null>;
	/** Assinatura ATIVA mais recente do tenant pra um produto (pra lógica de upgrade/downgrade). */
	findActiveForTenantProduct(
		tenantId: string,
		productId: string,
	): Promise<Subscription | null>;
	list(params: ListSubscriptionsParams): Promise<ListSubscriptionsResult>;
	create(data: CreateSubscriptionData): Promise<Subscription>;
	updateStatus(
		id: string,
		status: SubStatus,
		canceledAt?: Date,
	): Promise<Subscription>;
	delete(id: string): Promise<void>;
	countByPlan(planId: string): Promise<number>;
	countByProductAndStatus(
		productId: string,
		status: SubStatus,
	): Promise<number>;
	listActiveByProduct(
		productId: string,
	): Promise<{ plan: { price: unknown; interval: string } }[]>;
}
