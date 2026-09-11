import { prisma } from "../../shared/db.js";
import type { Prisma } from "@prisma/client";

export class SubscriptionService {
  static async listSubscriptions(params: { page?: number; limit?: number; search?: string; productId?: string; status?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = { AND: [] };
    const and = where.AND as Prisma.SubscriptionWhereInput[];

    if (params.search) {
      and.push({
        OR: [
          { tenant: { name: { contains: params.search, mode: "insensitive" } } },
          { licenseKey: { contains: params.search, mode: "insensitive" } },
          { plan: { product: { name: { contains: params.search, mode: "insensitive" } } } },
        ],
      });
    }
    if (params.productId) and.push({ plan: { productId: params.productId } });
    if (params.status) and.push({ status: params.status as Prisma.EnumSubStatusFilter["equals"] });

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: { tenant: true, plan: { include: { product: true } } },
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getSubscriptionById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: { tenant: true, plan: { include: { product: true } } },
    });
  }

  static async cancelSubscription(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  }

  static async deleteSubscription(id: string) {
    return prisma.subscription.delete({ where: { id } });
  }
}
