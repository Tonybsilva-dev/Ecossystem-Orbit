import crypto from "node:crypto";
import { prisma } from "../../shared/db.js";
import { ValidationError } from "../../shared/errors.js";
import type { Prisma, PlanInterval } from "@prisma/client";

export class ProductService {
  static async listProducts() {
    return prisma.product.findMany({
      include: { plans: { orderBy: { price: "asc" } } },
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
          include: { includedFeatures: true },
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
          include: { includedFeatures: true },
        },
      },
    });
  }

  static async createProduct(data: { name: string; slug: string; description?: string; logo?: string; apiKey?: string }) {
    let apiKey = data.apiKey;

    if (!apiKey) {
      const initials = data.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toLowerCase()
        .substring(0, 4);
      const randomSuffix = crypto.randomBytes(3).toString("hex").substring(0, 5);
      apiKey = `${initials}_live_${randomSuffix}`;
    }

    return prisma.product.create({ data: { ...data, apiKey } });
  }

  static async updateProduct(
    id: string,
    data: { name?: string; slug?: string; description?: string; logo?: string; apiKey?: string },
  ) {
    return prisma.product.update({ where: { id }, data });
  }

  static async deleteProduct(id: string) {
    const hasSubs = await prisma.subscription.count({ where: { plan: { productId: id } } });
    if (hasSubs > 0) throw new ValidationError("Cannot delete product with active subscriptions.");

    return prisma.$transaction([
      prisma.plan.deleteMany({ where: { productId: id } }),
      prisma.feature.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
  }

  // --- Plan Management ---

  static async createPlan(data: {
    productId: string;
    name: string;
    price: number;
    interval: PlanInterval;
    features: string[];
    limits?: Prisma.InputJsonValue;
    featureIds?: string[];
  }) {
    const { featureIds, ...rest } = data;
    return prisma.plan.create({
      data: {
        ...rest,
        limits: rest.limits ?? {},
        includedFeatures: featureIds ? { connect: featureIds.map((id) => ({ id })) } : undefined,
      },
    });
  }

  static async updatePlan(
    id: string,
    data: {
      name?: string;
      price?: number;
      interval?: PlanInterval;
      features?: string[];
      isActive?: boolean;
      limits?: Prisma.InputJsonValue;
      featureIds?: string[];
    },
  ) {
    const { featureIds, ...rest } = data;
    const updateData: Prisma.PlanUpdateInput = { ...rest };

    if (featureIds) {
      updateData.includedFeatures = { set: featureIds.map((fid) => ({ id: fid })) };
    }

    return prisma.plan.update({ where: { id }, data: updateData });
  }

  static async deletePlan(id: string) {
    const hasSubs = await prisma.subscription.count({ where: { planId: id } });
    if (hasSubs > 0) {
      return prisma.plan.update({ where: { id }, data: { isActive: false } });
    }
    return prisma.plan.delete({ where: { id } });
  }

  // --- Feature Management ---

  static async listFeatures(productId: string) {
    return prisma.feature.findMany({ where: { productId }, orderBy: { name: "asc" } });
  }

  static async createFeature(data: { productId: string; key: string; name: string; description?: string }) {
    return prisma.feature.create({ data });
  }

  static async updateFeature(id: string, data: { key?: string; name?: string; description?: string }) {
    return prisma.feature.update({ where: { id }, data });
  }

  static async deleteFeature(id: string) {
    return prisma.feature.delete({ where: { id } });
  }

  // --- Analytics ---

  static async getProductAnalytics(productId: string) {
    const activeSubs = await prisma.subscription.count({
      where: { plan: { productId }, status: "ACTIVE" },
    });
    const churnedSubs = await prisma.subscription.count({
      where: { plan: { productId }, status: "CANCELED" },
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { plan: { productId }, status: "ACTIVE" },
      include: { plan: true },
    });

    const mrr = subscriptions.reduce((acc, sub) => {
      const price = Number(sub.plan.price);
      return acc + (sub.plan.interval === "YEARLY" ? price / 12 : price);
    }, 0);

    return {
      activeSubscribers: activeSubs,
      churnRate: activeSubs + churnedSubs > 0 ? (churnedSubs / (activeSubs + churnedSubs)) * 100 : 0,
      mrr: mrr.toFixed(2),
    };
  }
}
