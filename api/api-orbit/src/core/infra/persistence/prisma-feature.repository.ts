import type { PrismaClient } from '@prisma/client';
import type { Feature } from '../../domain/feature/feature.entity.js';
import type {
	CreateFeatureData,
	FeatureRepository,
} from '../../domain/feature/feature.repository.js';

export class PrismaFeatureRepository implements FeatureRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async listByProduct(productId: string): Promise<Feature[]> {
		return this.prisma.feature.findMany({
			where: { productId },
			orderBy: { name: 'asc' },
		});
	}

	async create(data: CreateFeatureData): Promise<Feature> {
		return this.prisma.feature.create({ data });
	}

	async update(
		id: string,
		data: Partial<Omit<CreateFeatureData, 'productId'>>,
	): Promise<Feature> {
		return this.prisma.feature.update({ where: { id }, data });
	}

	async delete(id: string): Promise<void> {
		await this.prisma.feature.delete({ where: { id } });
	}

	async upsertByProductAndKey(
		productId: string,
		key: string,
		name: string,
	): Promise<Feature> {
		return this.prisma.feature.upsert({
			where: { productId_key: { productId, key } },
			update: { name },
			create: { productId, key, name },
		});
	}
}
