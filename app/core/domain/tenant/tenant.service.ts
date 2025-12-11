import { prisma } from "../../db/prisma.server";
import type { CreateTenantInput, UpdateTenantInput } from "./tenant.schema";
import { createTenantSchema, tenantSearchSchema } from "./tenant.schema";
import { hashPassword } from "../../auth/password.server";
import crypto from "node:crypto";

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
      // 3. Criar tenant no banco de dados
      const tenant = await prisma.tenant.create({
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
          subscriptions: validatedData.planId ? {
            create: {
              planId: validatedData.planId,
              status: "ACTIVE",
              licenseKey: crypto.randomUUID(), // Temporario, ideal usar crypto node
            }
          } : undefined
        },
        include: {
          users: true,
          subscriptions: true,
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

  /**
   * Realiza busca full-text de tenants por nome ou slug.
   * 
   * Esta função implementa busca case-insensitive nos campos `name` e `slug`
   * do modelo Tenant, retornando todos os tenants que correspondem à query.
   * 
   * A busca é otimizada com índices nos campos `name` e `slug` para melhor
   * performance em grandes volumes de dados.
   * 
   * @param query - String de busca (será validada e trimada)
   * @returns Array de tenants que correspondem à busca, ordenados por nome
   * @throws Error se a query for inválida (vazia, muito longa, etc.)
   * 
   * @example
   * ```ts
   * // Buscar tenants com "acme" no nome ou slug
   * const results = await TenantService.searchTenants("acme");
   * // Retorna tenants como "Acme Corp", "acme-enterprise", etc.
   * ```
   */
  /**
   * Adiciona uma assinatura a um tenant com lógica de extensão/upgrade.
   */
  static async addSubscription(tenantId: string, planId: string) {
    // 1. Obter detalhes do plano e produto
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true },
    });

    if (!plan) throw new Error("Plan not found");

    // 2. Verificar se já existe assinatura ATIVA para este PRODUTO
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        tenantId,
        plan: { productId: plan.productId },
        status: "ACTIVE"
      },
      include: { plan: true }
    });

    // Lógica 1: Se já tem assinatura do MESMO plano -> Estender Validade (fingindo que tem expiresAt por enquanto, ou apenas ignorando duplicidade)
    // Como o schema atual não tem expiresAt (ainda), vamos assumir que se já tem o mesmo plano ativo, não faz nada ou retorna a existente.
    // SE for plano diferente (Upgrade/Downgrade) -> Inativa a anterior e cria nova.

    if (existingSubscription) {
      if (existingSubscription.planId === planId) {
        // Mesmo plano: Estenderia a data aqui.
        // Por enquanto, retornamos a existente para não duplicar.
        return existingSubscription;
      } else {
        // Plano diferente (Upgrade/Downgrade):
        // 1. Inativar anterior
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: { status: "CANCELED" } // Ou "UPGRADED" se tiver esse status
        });
        // 2. Prosseguir para criar a nova
      }
    }

    // 3. Criar nova assinatura
    return prisma.subscription.create({
      data: {
        tenantId,
        planId,
        licenseKey: `LIC-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        status: "ACTIVE"
      }
    });
  }

  static async searchTenants(query: string) {
    // 1. Validar input usando Zod schema
    const validationResult = tenantSearchSchema.safeParse({ query });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      throw new Error(
        firstError?.message || "Query de busca inválida"
      );
    }

    const validatedQuery = validationResult.data.query;

    // 2. Realizar busca full-text usando Prisma
    // Usa OR para buscar em ambos os campos (name e slug)
    // mode: 'insensitive' torna a busca case-insensitive
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          {
            name: {
              contains: validatedQuery,
              mode: "insensitive",
            },
          },
          {
            slug: {
              contains: validatedQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        name: "asc",
      },
      include: {
        users: { // Incluir usuários para mostrar email do dono na lista
          where: { role: 'OWNER' },
          take: 1
        }
      }
    });

    return tenants;
  }
}
