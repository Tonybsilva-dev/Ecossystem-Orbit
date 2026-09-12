import type { PrismaClient } from '@prisma/client';
import type {
	Tenant,
	TenantStatus,
	TenantWithRelations,
} from '../../domain/tenant/tenant.entity.js';
import type {
	CreateTenantData,
	TenantRepository,
	UpdateTenantData,
} from '../../domain/tenant/tenant.repository.js';

export class PrismaTenantRepository implements TenantRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findById(id: string): Promise<Tenant | null> {
		return this.prisma.tenant.findUnique({ where: { id } });
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		return this.prisma.tenant.findUnique({ where: { slug } });
	}

	async list(): Promise<TenantWithRelations[]> {
		return this.prisma.tenant.findMany({
			include: {
				users: { take: 1, where: { role: 'OWNER' } },
				subscriptions: { include: { plan: { include: { product: true } } } },
			},
			orderBy: { createdAt: 'desc' },
		}) as unknown as Promise<TenantWithRelations[]>;
	}

	async search(query: string): Promise<TenantWithRelations[]> {
		return this.prisma.tenant.findMany({
			where: {
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ slug: { contains: query, mode: 'insensitive' } },
				],
			},
			orderBy: { name: 'asc' },
			include: {
				users: { where: { role: 'OWNER' }, take: 1 },
				subscriptions: { include: { plan: { include: { product: true } } } },
			},
		}) as unknown as Promise<TenantWithRelations[]>;
	}

	async create(data: CreateTenantData): Promise<Tenant> {
		return this.prisma.tenant.create({
			data: {
				name: data.name,
				slug: data.slug,
				status: data.status ?? 'ACTIVE',
			},
		});
	}

	async update(id: string, data: UpdateTenantData): Promise<Tenant> {
		return this.prisma.tenant.update({ where: { id }, data });
	}

	async setStatus(id: string, status: TenantStatus): Promise<Tenant> {
		return this.prisma.tenant.update({ where: { id }, data: { status } });
	}
}
