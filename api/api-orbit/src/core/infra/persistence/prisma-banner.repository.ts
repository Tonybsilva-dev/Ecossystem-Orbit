import type { PrismaClient } from '@prisma/client';
import type { Banner } from '../../domain/banner/banner.entity.js';
import type {
	BannerRepository,
	CreateBannerData,
	UpdateBannerData,
} from '../../domain/banner/banner.repository.js';

export class PrismaBannerRepository implements BannerRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async list(): Promise<Banner[]> {
		return this.prisma.banner.findMany({ orderBy: { createdAt: 'desc' } });
	}

	async findById(id: string): Promise<Banner | null> {
		return this.prisma.banner.findUnique({ where: { id } });
	}

	async create(data: CreateBannerData): Promise<Banner> {
		return this.prisma.banner.create({
			data: { ...data, type: data.type ?? 'INFO' },
		});
	}

	async update(id: string, data: UpdateBannerData): Promise<Banner> {
		return this.prisma.banner.update({ where: { id }, data });
	}

	async delete(id: string): Promise<void> {
		await this.prisma.banner.delete({ where: { id } });
	}

	async findActiveFor(productId: string, tenantId: string): Promise<Banner[]> {
		const now = new Date();
		return this.prisma.banner.findMany({
			where: {
				isActive: true,
				AND: [
					{ OR: [{ productId: null }, { productId }] },
					{ OR: [{ tenantId: null }, { tenantId }] },
					{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
					{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
				],
			},
			orderBy: { createdAt: 'desc' },
		});
	}
}
