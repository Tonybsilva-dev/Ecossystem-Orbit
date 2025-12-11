import { prisma } from "../../db/prisma.server";
import type { PlanInterval } from "../../../generated/client/enums";

export class ProductService {
  static async listProducts() {
    return prisma.product.findMany({
      include: {
        plans: {
          orderBy: { price: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getProductBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });
  }

  static async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });
  }

  static async createProduct(data: { name: string; slug: string; description?: string; logo?: string; apiKey?: string }) {
    return prisma.product.create({
      data,
    });
  }

  static async updateProduct(id: string, data: { name?: string; slug?: string; description?: string; logo?: string; apiKey?: string }) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  static async deleteProduct(id: string) {
    // Check for subscriptions first
    const hasSubs = await prisma.subscription.count({
      where: { plan: { productId: id } }
    });

    if (hasSubs > 0) throw new Error("Cannot delete product with active subscriptions.");

    return prisma.product.delete({
      where: { id },
    });
  }

  // --- Plan Management ---

  static async createPlan(data: { productId: string; name: string; price: number; interval: PlanInterval; features: string[] }) {
    return prisma.plan.create({
      data: {
        ...data,
        price: data.price, // Prisma Decimal handles number/string
      },
    });
  }

  static async updatePlan(id: string, data: { name?: string; price?: number; interval?: PlanInterval; features?: string[]; isActive?: boolean }) {
    return prisma.plan.update({
      where: { id },
      data: {
        ...data,
        price: data.price,
      },
    });
  }

  static async deletePlan(id: string) {
    const hasSubs = await prisma.subscription.count({
      where: { planId: id }
    });

    if (hasSubs > 0) {
      // Soft delete if logic requires it, or just deactivate
      return prisma.plan.update({ where: { id }, data: { isActive: false } });
    }

    return prisma.plan.delete({ where: { id } });
  }

  // --- Analytics ---

  static async getProductAnalytics(productId: string) {
    const activeSubs = await prisma.subscription.count({
      where: {
        plan: { productId },
        status: 'ACTIVE'
      }
    });

    const churnedSubs = await prisma.subscription.count({
      where: {
        plan: { productId },
        status: 'CANCELED'
      }
    });

    // Approximate MRR (Monthly Recurring Revenue)
    // Fetch all active subscriptions and sum their plan price (normalized to monthly)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        plan: { productId },
        status: 'ACTIVE'
      },
      include: { plan: true }
    });

    const mrr = subscriptions.reduce((acc, sub) => {
      const price = Number(sub.plan.price);
      return acc + (sub.plan.interval === 'YEARLY' ? price / 12 : price);
    }, 0);

    return {
      activeSubscribers: activeSubs,
      churnRate: (activeSubs + churnedSubs) > 0 ? (churnedSubs / (activeSubs + churnedSubs)) * 100 : 0,
      mrr: mrr.toFixed(2)
    };
  }
}
