import type { Prisma, PrismaClient } from '@prisma/client';
import type {
	SubStatus,
	Subscription,
	SubscriptionWithRelations,
} from '../../domain/subscription/subscription.entity.js';
import type {
	CreateSubscriptionData,
	ListSubscriptionsParams,
	ListSubscriptionsResult,
	SubscriptionRepository,
} from '../../domain/subscription/subscription.repository.js';

export class PrismaSubscriptionRepository implements SubscriptionRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findById(id: string): Promise<SubscriptionWithRelations | null> {
		return this.prisma.subscription.findUnique({
			where: { id },
			include: { tenant: true, plan: { include: { product: true } } },
		}) as unknown as Promise<SubscriptionWithRelations | null>;
	}

	async findByLicenseKey(
		licenseKey: string,
	): Promise<SubscriptionWithRelations | null> {
		return this.prisma.subscription.findUnique({
			where: { licenseKey },
			include: { tenant: true, plan: { include: { product: true } } },
		}) as unknown as Promise<SubscriptionWithRelations | null>;
	}

	async findByLicenseKeyWithFeatures(
		licenseKey: string,
	): Promise<SubscriptionWithRelations | null> {
		return this.prisma.subscription.findUnique({
			where: { licenseKey },
			include: {
				tenant: { include: { features: true } },
				plan: { include: { product: true } },
			},
		}) as unknown as Promise<SubscriptionWithRelations | null>;
	}

	async findActiveForTenantProduct(
		tenantId: string,
		productId: string,
	): Promise<Subscription | null> {
		return this.prisma.subscription.findFirst({
			where: { tenantId, plan: { productId }, status: 'ACTIVE' },
		});
	}

	async list(
		params: ListSubscriptionsParams,
	): Promise<ListSubscriptionsResult> {
		const skip = (params.page - 1) * params.limit;
		const where: Prisma.SubscriptionWhereInput = { AND: [] };
		const and = where.AND as Prisma.SubscriptionWhereInput[];

		if (params.search) {
			and.push({
				OR: [
					{
						tenant: { name: { contains: params.search, mode: 'insensitive' } },
					},
					{ licenseKey: { contains: params.search, mode: 'insensitive' } },
					{
						plan: {
							product: {
								name: { contains: params.search, mode: 'insensitive' },
							},
						},
					},
				],
			});
		}
		if (params.productId) and.push({ plan: { productId: params.productId } });
		if (params.status) and.push({ status: params.status as SubStatus });

		const [subscriptions, total] = await Promise.all([
			this.prisma.subscription.findMany({
				where,
				take: params.limit,
				skip,
				orderBy: { createdAt: 'desc' },
				include: { tenant: true, plan: { include: { product: true } } },
			}),
			this.prisma.subscription.count({ where }),
		]);

		return {
			subscriptions: subscriptions as unknown as SubscriptionWithRelations[],
			pagination: {
				total,
				page: params.page,
				limit: params.limit,
				totalPages: Math.ceil(total / params.limit),
			},
		};
	}

	async create(data: CreateSubscriptionData): Promise<Subscription> {
		return this.prisma.subscription.create({
			data: { ...data, status: data.status ?? 'ACTIVE' },
		});
	}

	async updateStatus(
		id: string,
		status: SubStatus,
		canceledAt?: Date,
	): Promise<Subscription> {
		return this.prisma.subscription.update({
			where: { id },
			data: { status, canceledAt },
		});
	}

	async delete(id: string): Promise<void> {
		await this.prisma.subscription.delete({ where: { id } });
	}

	async countByPlan(planId: string): Promise<number> {
		return this.prisma.subscription.count({ where: { planId } });
	}

	async countByProductAndStatus(
		productId: string,
		status: SubStatus,
	): Promise<number> {
		return this.prisma.subscription.count({
			where: { plan: { productId }, status },
		});
	}

	async listActiveByProduct(
		productId: string,
	): Promise<{ plan: { price: unknown; interval: string } }[]> {
		return this.prisma.subscription.findMany({
			where: { plan: { productId }, status: 'ACTIVE' },
			include: { plan: true },
		});
	}
}
