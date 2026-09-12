import type { Prisma, PrismaClient } from '@prisma/client';
import type { Plan } from '../../domain/plan/plan.entity.js';
import type {
	CreatePlanData,
	PlanRepository,
	PlanWithProduct,
	UpdatePlanData,
} from '../../domain/plan/plan.repository.js';

export class PrismaPlanRepository implements PlanRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findById(id: string): Promise<PlanWithProduct | null> {
		return this.prisma.plan.findUnique({
			where: { id },
			include: { product: { select: { id: true } } },
		}) as unknown as Promise<PlanWithProduct | null>;
	}

	async findFirstByProductAndName(
		productId: string,
		name: string,
	): Promise<Plan | null> {
		return this.prisma.plan.findFirst({ where: { productId, name } });
	}

	async create(data: CreatePlanData): Promise<Plan> {
		const { featureIds, ...rest } = data;
		return this.prisma.plan.create({
			data: {
				...rest,
				limits: (rest.limits ?? {}) as Prisma.InputJsonValue,
				includedFeatures: featureIds
					? { connect: featureIds.map((id) => ({ id })) }
					: undefined,
			},
		});
	}

	async update(id: string, data: UpdatePlanData): Promise<Plan> {
		const { featureIds, ...rest } = data;
		const updateData: Prisma.PlanUpdateInput = {
			...rest,
			limits: rest.limits as Prisma.InputJsonValue,
		};

		if (featureIds) {
			updateData.includedFeatures = {
				set: featureIds.map((fid) => ({ id: fid })),
			};
		}

		return this.prisma.plan.update({ where: { id }, data: updateData });
	}

	async deleteOrDeactivate(id: string): Promise<Plan | { deleted: true }> {
		const hasSubs = await this.countSubscriptions(id);
		if (hasSubs > 0) {
			return this.prisma.plan.update({
				where: { id },
				data: { isActive: false },
			});
		}
		await this.prisma.plan.delete({ where: { id } });
		return { deleted: true };
	}

	async countSubscriptions(id: string): Promise<number> {
		return this.prisma.subscription.count({ where: { planId: id } });
	}
}
