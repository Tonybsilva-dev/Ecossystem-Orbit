import type {
	Tenant,
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

export interface TenantRepository {
	findById(id: string): Promise<Tenant | null>;
	findBySlug(slug: string): Promise<Tenant | null>;
	list(): Promise<TenantWithRelations[]>;
	search(query: string): Promise<TenantWithRelations[]>;
	create(data: CreateTenantData): Promise<Tenant>;
	update(id: string, data: UpdateTenantData): Promise<Tenant>;
	setStatus(id: string, status: TenantStatus): Promise<Tenant>;
}
