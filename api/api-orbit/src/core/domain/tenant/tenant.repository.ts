import type {
	Tenant,
	TenantDetail,
	TenantStatus,
	TenantWithRelations,
} from './tenant.entity.js';

export interface CreateTenantData {
	name: string;
	slug: string;
	status?: TenantStatus;
}

export interface UpdateTenantData {
	name?: string;
	slug?: string;
	status?: TenantStatus;
}

export interface ListTenantsFilters {
	productId?: string;
	planId?: string;
	search?: string;
}

export interface TenantRepository {
	findById(id: string): Promise<Tenant | null>;
	findBySlug(slug: string): Promise<Tenant | null>;
	/** Página de detalhe: todos os usuários + histórico completo de assinaturas. */
	findByIdWithRelations(id: string): Promise<TenantDetail | null>;
	list(filters?: ListTenantsFilters): Promise<TenantWithRelations[]>;
	search(query: string): Promise<TenantWithRelations[]>;
	create(data: CreateTenantData): Promise<Tenant>;
	update(id: string, data: UpdateTenantData): Promise<Tenant>;
	setStatus(id: string, status: TenantStatus): Promise<Tenant>;
}
