import { prisma } from "../../db/prisma.server";
import type { CreateTenantInput, UpdateTenantInput } from "./tenant.schema";
import { createTenantSchema } from "./tenant.schema";
import { hashPassword } from "../../auth/password.server";

export class TenantService {
  /**
   * Cria um novo tenant com validação de dados e tratamento de erros.
   * 
   * @param data - Dados do tenant e usuário inicial
   * @returns Tenant criado com usuário e plano incluídos
   * @throws Error com mensagem específica para constraint única (slug ou email)
   * @throws Error com mensagem de validação se os dados forem inválidos
   */
  static async create(data: unknown) {
    // 1. Validar input usando Zod schema
    const validationResult = createTenantSchema.safeParse(data);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      throw new Error(
        firstError?.message || "Dados inválidos para criação de tenant"
      );
    }

    const validatedData = validationResult.data;

    // 2. Hash da senha do usuário
    const hashedPassword = await hashPassword(validatedData.user.password);

    try {
      // 3. Criar tenant no banco de dados
      const tenant = await prisma.tenant.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          status: validatedData.status || "ACTIVE",
          planId: validatedData.planId || null,
          users: {
            create: {
              email: validatedData.user.email,
              name: validatedData.user.name || null,
              passwordHash: hashedPassword,
              role: "OWNER",
            },
          },
        },
        include: {
          users: true,
          plan: true,
        },
      });

      return tenant;
    } catch (error: unknown) {
      // 4. Tratar erros de constraint única (P2002)
      // Verificar se é um erro do Prisma
      if (error && typeof error === "object" && "code" in error) {
        const prismaError = error as {
          code: string;
          meta?: { target?: string[] };
        };

        // Verificar se é erro de constraint única
        if (prismaError.code === "P2002" && "meta" in prismaError) {
          const target = prismaError.meta?.target as string[] | undefined;

          if (target?.includes("slug")) {
            throw new Error(`O slug "${validatedData.slug}" já está em uso`);
          }

          if (target?.includes("email")) {
            throw new Error(
              `O email "${validatedData.user.email}" já está cadastrado`
            );
          }

          // Constraint única genérica
          throw new Error("Já existe um registro com esses dados");
        }
      }

      // Re-throw outros erros
      throw error;
    }
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

  /**
   * Busca um tenant pelo slug, otimizado para retornar apenas campos essenciais.
   * 
   * @param slug - Slug único do tenant
   * @returns Tenant com apenas campos essenciais ou null se não encontrado
   */
  static async findTenantBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        planId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async list() {
    return prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Retorna todos os tenants cadastrados.
   * 
   * @returns Array de todos os tenants ordenados por data de criação (mais recentes primeiro)
   */
  static async getAllTenants() {
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

  /**
   * Busca um tenant pela chave de licença (licenseKey).
   * 
   * Nota: No schema atual, o licenseKey é mapeado para o campo `slug` do tenant,
   * que é único e serve como identificador de licença.
   * 
   * @param licenseKey - Chave de licença (slug do tenant)
   * @returns Tenant encontrado ou null se não existir
   */
  static async findTenantByLicenseKey(licenseKey: string) {
    return prisma.tenant.findUnique({
      where: { slug: licenseKey },
    });
  }
}
