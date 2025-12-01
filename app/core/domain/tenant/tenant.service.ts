import { prisma } from "../../db/prisma.server";
import type { CreateTenantInput, UpdateTenantInput } from "./tenant.schema";
import { hashPassword } from "../../auth/password.server";

export class TenantService {
  static async create(data: CreateTenantInput) {
    const hashedPassword = await hashPassword(data.user.password);

    return prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: "ACTIVE",
        users: {
          create: {
            email: data.user.email,
            name: data.user.name,
            passwordHash: hashedPassword,
            role: "OWNER",
          },
        },
      },
      include: {
        users: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
    });
  }

  static async findBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
    });
  }

  static async list() {
    return prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async update(id: string, data: UpdateTenantInput) {
    return prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
