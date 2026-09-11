import crypto from "node:crypto";
import { prisma } from "../../shared/db.js";
import { ConflictError, ValidationError } from "../../shared/errors.js";
import { hashPassword } from "../auth/password.js";
import { createTenantSchema, tenantSearchSchema, type UpdateTenantInput } from "./tenant.schema.js";

export class TenantService {
  static async create(data: unknown) {
    const validationResult = createTenantSchema.safeParse(data);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      throw new ValidationError(firstError?.message || "Dados inválidos para criação de tenant");
    }

    const validatedData = validationResult.data;
    const hashedPassword = await hashPassword(validatedData.user.password);

    try {
      return await prisma.tenant.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          status: validatedData.status || "ACTIVE",
          users: {
            create: {
              email: validatedData.user.email,
              name: validatedData.user.name || null,
              passwordHash: hashedPassword,
              role: "OWNER",
            },
          },
          subscriptions: validatedData.planId
            ? {
                create: {
                  planId: validatedData.planId,
                  status: "ACTIVE",
                  licenseKey: crypto.randomUUID(),
                },
              }
            : undefined,
        },
        include: { users: true, subscriptions: true },
      });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] } };

        if (prismaError.code === "P2002") {
          const target = prismaError.meta?.target as string[] | undefined;
          if (target?.includes("slug")) {
            throw new ConflictError(`O slug "${validatedData.slug}" já está em uso`);
          }
          if (target?.includes("email")) {
            throw new ConflictError(`O email "${validatedData.user.email}" já está cadastrado`);
          }
          throw new ConflictError("Já existe um registro com esses dados");
        }
      }
      throw error;
    }
  }

  static async findById(id: string) {
    return prisma.tenant.findUnique({ where: { id } });
  }

  static async findBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } });
  }

  static async list() {
    return prisma.tenant.findMany({
      include: {
        users: { take: 1, where: { role: "OWNER" } },
        subscriptions: { include: { plan: { include: { product: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async update(id: string, data: UpdateTenantInput) {
    return prisma.tenant.update({ where: { id }, data });
  }

  /**
   * Kill switch: alterna status do tenant (ACTIVE bloqueia/libera acesso via
   * validateAccess, que checa tenant.status === "ACTIVE").
   */
  static async setStatus(id: string, status: "ACTIVE" | "INACTIVE" | "PAST_DUE") {
    return prisma.tenant.update({ where: { id }, data: { status } });
  }

  /**
   * Adiciona/atualiza assinatura de um tenant com lógica de upgrade/downgrade.
   */
  static async addSubscription(tenantId: string, planId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId }, include: { product: true } });
    if (!plan) throw new ValidationError("Plan not found");

    const existingSubscription = await prisma.subscription.findFirst({
      where: { tenantId, plan: { productId: plan.productId }, status: "ACTIVE" },
      include: { plan: true },
    });

    if (existingSubscription) {
      if (existingSubscription.planId === planId) {
        return existingSubscription;
      }
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: { status: "CANCELED" },
      });
    }

    return prisma.subscription.create({
      data: {
        tenantId,
        planId,
        licenseKey: `LIC-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        status: "ACTIVE",
      },
    });
  }

  static async searchTenants(query: string) {
    const validationResult = tenantSearchSchema.safeParse({ query });
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      throw new ValidationError(firstError?.message || "Query de busca inválida");
    }

    return prisma.tenant.findMany({
      where: {
        OR: [
          { name: { contains: validationResult.data.query, mode: "insensitive" } },
          { slug: { contains: validationResult.data.query, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      include: {
        users: { where: { role: "OWNER" }, take: 1 },
      },
    });
  }
}
