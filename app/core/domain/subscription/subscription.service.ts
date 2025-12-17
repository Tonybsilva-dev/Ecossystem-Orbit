import { prisma } from "../../db/prisma.server";

export class SubscriptionService {
  static async listSubscriptions(params: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: string;
    status?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const search = params.search || "";
    const productId = params.productId || undefined;
    const status = params.status || undefined;

    const skip = (page - 1) * limit;

    const where: any = {
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          { tenant: { name: { contains: search, mode: "insensitive" } } },
          { licenseKey: { contains: search, mode: "insensitive" } },
          { plan: { product: { name: { contains: search, mode: "insensitive" } } } },
        ],
      });
    }

    if (productId) {
      where.AND.push({ plan: { productId } });
    }

    if (status) {
      where.AND.push({ status });
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          tenant: true,
          plan: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getSubscriptionById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        tenant: true,
        plan: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  static async cancelSubscription(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
      },
    });
  }

  static async deleteSubscription(id: string) {
    return prisma.subscription.delete({
      where: { id },
    });
  }
}
