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

  static async getProductBySlug(slug: string, includeInactive = false) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        plans: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: { price: "asc" },
          include: { includedFeatures: true }
        },
      },
    });
  }

  static async getProductById(id: string, includeInactive = false) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        plans: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: { price: "asc" },
          include: { includedFeatures: true }
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

  static async createPlan(data: { productId: string; name: string; price: number; interval: PlanInterval; features: string[]; limits?: any; featureIds?: string[] }) {
    const { features, limits, featureIds, ...rest } = data;

    const plan = await prisma.plan.create({
      data: {
        ...rest,
        price: rest.price,
        features: features, // Legacy
        limits: limits || {},
        includedFeatures: featureIds ? {
          connect: featureIds.map(id => ({ id }))
        } : undefined
      },
    });
    return plan;
  }

  static async updatePlan(id: string, data: { name?: string; price?: number; interval?: PlanInterval; features?: string[]; isActive?: boolean; limits?: any; featureIds?: string[] }) {
    const { features, limits, featureIds, ...rest } = data;
    const updateData: any = { ...rest };

    if (features !== undefined) updateData.features = features;
    if (limits !== undefined) updateData.limits = limits;
    if (rest.price !== undefined) updateData.price = rest.price;

    if (featureIds) {
      updateData.includedFeatures = {
        set: featureIds.map(fid => ({ id: fid }))
      };
    }

    return prisma.plan.update({
      where: { id },
      data: updateData,
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

  // --- Feature Management ---

  static async listFeatures(productId: string) {
    return prisma.feature.findMany({
      where: { productId },
      orderBy: { name: 'asc' }
    });
  }

  static async createFeature(data: { productId: string; key: string; name: string; description?: string }) {
    return prisma.feature.create({
      data
    });
  }

  static async updateFeature(id: string, data: { key?: string; name?: string; description?: string }) {
    return prisma.feature.update({
      where: { id },
      data
    });
  }

  static async deleteFeature(id: string) {
    // Check if used in plans? 
    // If we delete a feature, we might need to remove it from plans or error out.
    // For now, let's just delete (cascade likely handles relation, but safety first).
    return prisma.feature.delete({
      where: { id }
    });
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
