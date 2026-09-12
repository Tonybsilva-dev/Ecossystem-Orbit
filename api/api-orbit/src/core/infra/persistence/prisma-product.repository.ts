import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { Product } from '../../domain/product/product.entity.js';
import type {
	CreateProductData,
	ProductRepository,
	ProductWithPlans,
} from '../../domain/product/product.repository.js';

export class PrismaProductRepository implements ProductRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findById(id: string): Promise<Product | null> {
		return this.prisma.product.findUnique({ where: { id } });
	}

	async findBySlug(slug: string): Promise<Product | null> {
		return this.prisma.product.findUnique({ where: { slug } });
	}

	async findBySlugWithPlans(
		slug: string,
		includeInactive: boolean,
	): Promise<ProductWithPlans | null> {
		return this.prisma.product.findUnique({
			where: { slug },
			include: {
				plans: {
					where: includeInactive ? undefined : { isActive: true },
					orderBy: { price: 'asc' },
					include: { includedFeatures: true },
				},
			},
		}) as unknown as Promise<ProductWithPlans | null>;
	}

	async findByIdWithPlans(
		id: string,
		includeInactive: boolean,
	): Promise<ProductWithPlans | null> {
		return this.prisma.product.findUnique({
			where: { id },
			include: {
				plans: {
					where: includeInactive ? undefined : { isActive: true },
					orderBy: { price: 'asc' },
					include: { includedFeatures: true },
				},
			},
		}) as unknown as Promise<ProductWithPlans | null>;
	}

	async list(): Promise<ProductWithPlans[]> {
		return this.prisma.product.findMany({
			include: { plans: { orderBy: { price: 'asc' } } },
			orderBy: { createdAt: 'desc' },
		}) as unknown as Promise<ProductWithPlans[]>;
	}

	async create(data: CreateProductData): Promise<Product> {
		let apiKey = data.apiKey;

		if (!apiKey) {
			const initials = data.name
				.split(' ')
				.map((word) => word[0])
				.join('')
				.toLowerCase()
				.substring(0, 4);
			const randomSuffix = crypto
				.randomBytes(3)
				.toString('hex')
				.substring(0, 5);
			apiKey = `${initials}_live_${randomSuffix}`;
		}

		return this.prisma.product.create({ data: { ...data, apiKey } });
	}

	async update(id: string, data: Partial<CreateProductData>): Promise<Product> {
		return this.prisma.product.update({ where: { id }, data });
	}

	async delete(id: string): Promise<void> {
		await this.prisma.$transaction([
			this.prisma.plan.deleteMany({ where: { productId: id } }),
			this.prisma.feature.deleteMany({ where: { productId: id } }),
			this.prisma.product.delete({ where: { id } }),
		]);
	}
}
