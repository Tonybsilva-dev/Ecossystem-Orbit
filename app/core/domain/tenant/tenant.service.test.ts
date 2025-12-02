import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TenantService } from "./tenant.service";
import { prisma } from "../../db/prisma.server";
import type { CreateTenantInput } from "./tenant.schema";

// Desabilitar execução paralela para evitar conflitos com banco de dados
describe("TenantService.create", () => {
  // Limpar dados de teste após cada teste
  // Usar padrão específico para evitar remover dados de outros testes
  afterEach(async () => {
    // Limpar apenas dados de teste criados neste describe block
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: "test-",
        },
      },
    });
    await prisma.tenant.deleteMany({
      where: {
        slug: {
          startsWith: "test-",
        },
      },
    });
  });

  it("deve criar um tenant com dados válidos", async () => {
    const validData: CreateTenantInput = {
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE",
      user: {
        email: "test-owner@example.com",
        name: "Test Owner",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(validData);

    expect(tenant).toBeDefined();
    expect(tenant.id).toBeDefined();
    expect(tenant.name).toBe("Test Tenant");
    expect(tenant.slug).toBe("test-tenant");
    expect(tenant.status).toBe("ACTIVE");
    expect(tenant.users).toBeDefined();
    expect(tenant.users.length).toBe(1);
    expect(tenant.users[0].email).toBe("test-owner@example.com");
    expect(tenant.users[0].role).toBe("OWNER");
    expect(tenant.users[0].passwordHash).toBeDefined();

    // Verificar que o tenant existe no banco
    const tenantInDb = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: { users: true },
    });

    expect(tenantInDb).toBeDefined();
    expect(tenantInDb?.name).toBe("Test Tenant");
    expect(tenantInDb?.users.length).toBe(1);
  });

  it("deve criar tenant com planId opcional", async () => {
    const validData: CreateTenantInput = {
      name: "Test Tenant With Plan",
      slug: "test-tenant-plan",
      planId: null,
      user: {
        email: "test-owner-plan@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(validData);

    expect(tenant).toBeDefined();
    expect(tenant.planId).toBeNull();
  });

  it("deve rejeitar criação com slug duplicado", async () => {
    // Usar timestamp para garantir slug único mesmo em execução paralela
    const timestamp = Date.now();
    const uniqueSlug = `test-duplicate-slug-${timestamp}`;
    
    const validData: CreateTenantInput = {
      name: "Test Tenant",
      slug: uniqueSlug,
      user: {
        email: `test-owner1-${timestamp}@example.com`,
        password: "senhaSegura123",
      },
    };

    // Criar primeiro tenant
    const firstTenant = await TenantService.create(validData);
    
    // Verificar que o primeiro tenant foi criado
    expect(firstTenant).toBeDefined();
    expect(firstTenant.slug).toBe(uniqueSlug);

    // Verificar que o tenant ainda existe no banco antes de tentar criar o duplicado
    const tenantInDb = await prisma.tenant.findUnique({
      where: { slug: uniqueSlug },
    });
    expect(tenantInDb).toBeDefined();
    expect(tenantInDb?.slug).toBe(uniqueSlug);

    // Tentar criar segundo tenant com mesmo slug
    const duplicateData: CreateTenantInput = {
      name: "Test Tenant 2",
      slug: uniqueSlug, // Mesmo slug
      user: {
        email: `test-owner2-${timestamp}@example.com`,
        password: "senhaSegura123",
      },
    };

    await expect(TenantService.create(duplicateData)).rejects.toThrow(
      `O slug "${uniqueSlug}" já está em uso`
    );
  });

  it("deve rejeitar criação com email duplicado", async () => {
    // Usar timestamp para garantir email único mesmo em execução paralela
    const timestamp = Date.now();
    const uniqueEmail = `test-duplicate-email-${timestamp}@example.com`;
    const uniqueSlug1 = `test-tenant-1-${timestamp}`;
    const uniqueSlug2 = `test-tenant-2-${timestamp}`;
    
    const validData: CreateTenantInput = {
      name: "Test Tenant",
      slug: uniqueSlug1,
      user: {
        email: uniqueEmail,
        password: "senhaSegura123",
      },
    };

    // Criar primeiro tenant
    const firstTenant = await TenantService.create(validData);
    
    // Verificar que o primeiro tenant foi criado
    expect(firstTenant).toBeDefined();
    expect(firstTenant.users[0].email).toBe(uniqueEmail);

    // Verificar que o usuário ainda existe no banco antes de tentar criar o duplicado
    const userInDb = await prisma.user.findUnique({
      where: { email: uniqueEmail },
    });
    expect(userInDb).toBeDefined();
    expect(userInDb?.email).toBe(uniqueEmail);

    // Tentar criar segundo tenant com mesmo email
    const duplicateData: CreateTenantInput = {
      name: "Test Tenant 2",
      slug: uniqueSlug2,
      user: {
        email: uniqueEmail, // Mesmo email
        password: "senhaSegura123",
      },
    };

    await expect(TenantService.create(duplicateData)).rejects.toThrow(
      `O email "${uniqueEmail}" já está cadastrado`
    );
  });

  it("deve rejeitar dados inválidos (validação Zod)", async () => {
    const invalidData = {
      name: "AB", // Muito curto
      slug: "test-invalid",
      user: {
        email: "invalid-email", // Email inválido
        password: "123", // Senha muito curta
      },
    };

    await expect(TenantService.create(invalidData)).rejects.toThrow();
  });

  it("deve rejeitar slug inválido (validação Zod)", async () => {
    const invalidData = {
      name: "Test Tenant",
      slug: "Invalid Slug", // Slug com espaços e maiúsculas
      user: {
        email: "test@example.com",
        password: "senhaSegura123",
      },
    };

    await expect(TenantService.create(invalidData)).rejects.toThrow(
      "kebab-case"
    );
  });

  it("deve criar tenant com status padrão ACTIVE quando não fornecido", async () => {
    const validData: CreateTenantInput = {
      name: "Test Tenant Default Status",
      slug: "test-default-status",
      user: {
        email: "test-default@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(validData);

    expect(tenant.status).toBe("ACTIVE");
  });

  it("deve criar tenant com status customizado", async () => {
    const validData: CreateTenantInput = {
      name: "Test Tenant Inactive",
      slug: "test-inactive",
      status: "INACTIVE",
      user: {
        email: "test-inactive@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(validData);

    expect(tenant.status).toBe("INACTIVE");
  });

  it("deve criar tenant com usuário sem nome (opcional)", async () => {
    const validData: CreateTenantInput = {
      name: "Test Tenant No User Name",
      slug: "test-no-user-name",
      user: {
        email: "test-no-name@example.com",
        password: "senhaSegura123",
        // name não fornecido
      },
    };

    const tenant = await TenantService.create(validData);

    expect(tenant.users[0].name).toBeNull();
  });
});

describe("TenantService.findTenantBySlug", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
  });

  it("deve encontrar um tenant existente pelo slug", async () => {
    // Criar tenant de teste
    const tenantData: CreateTenantInput = {
      name: "Test Tenant Find",
      slug: "test-find-slug",
      user: {
        email: "test-find@example.com",
        password: "senhaSegura123",
      },
    };

    const createdTenant = await TenantService.create(tenantData);

    // Buscar pelo slug
    const foundTenant = await TenantService.findTenantBySlug("test-find-slug");

    expect(foundTenant).toBeDefined();
    expect(foundTenant?.id).toBe(createdTenant.id);
    expect(foundTenant?.name).toBe("Test Tenant Find");
    expect(foundTenant?.slug).toBe("test-find-slug");
    expect(foundTenant?.status).toBe("ACTIVE");
    // Verificar que apenas campos essenciais estão presentes
    expect(foundTenant).toHaveProperty("id");
    expect(foundTenant).toHaveProperty("name");
    expect(foundTenant).toHaveProperty("slug");
    expect(foundTenant).toHaveProperty("status");
    expect(foundTenant).toHaveProperty("planId");
    expect(foundTenant).toHaveProperty("createdAt");
    expect(foundTenant).toHaveProperty("updatedAt");
    // Verificar que campos não selecionados não estão presentes
    expect(foundTenant).not.toHaveProperty("users");
    expect(foundTenant).not.toHaveProperty("plan");
    expect(foundTenant).not.toHaveProperty("features");
  });

  it("deve retornar null para slug inexistente", async () => {
    const foundTenant = await TenantService.findTenantBySlug("non-existent-slug");

    expect(foundTenant).toBeNull();
  });
});

describe("TenantService.getAllTenants", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
  });

  it("deve retornar array vazio quando não há tenants", async () => {
    const tenants = await TenantService.getAllTenants();

    expect(tenants).toBeDefined();
    expect(Array.isArray(tenants)).toBe(true);
    expect(tenants.length).toBe(0);
  });

  it("deve retornar todos os tenants cadastrados", async () => {
    // Criar múltiplos tenants
    const tenant1: CreateTenantInput = {
      name: "Test Tenant 1",
      slug: "test-tenant-1",
      user: {
        email: "test-1@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant2: CreateTenantInput = {
      name: "Test Tenant 2",
      slug: "test-tenant-2",
      user: {
        email: "test-2@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant3: CreateTenantInput = {
      name: "Test Tenant 3",
      slug: "test-tenant-3",
      user: {
        email: "test-3@example.com",
        password: "senhaSegura123",
      },
    };

    const created1 = await TenantService.create(tenant1);
    const created2 = await TenantService.create(tenant2);
    const created3 = await TenantService.create(tenant3);

    // Verificar que todos foram criados
    expect(created1).toBeDefined();
    expect(created2).toBeDefined();
    expect(created3).toBeDefined();

    const tenants = await TenantService.getAllTenants();

    expect(tenants).toBeDefined();
    expect(Array.isArray(tenants)).toBe(true);
    
    // Filtrar apenas os tenants de teste criados neste teste
    const testTenants = tenants.filter((t) => 
      t.slug === "test-tenant-1" || 
      t.slug === "test-tenant-2" || 
      t.slug === "test-tenant-3"
    );
    
    expect(testTenants.length).toBe(3);

    // Verificar que os tenants criados estão na lista
    const slugs = testTenants.map((t) => t.slug);
    expect(slugs).toContain("test-tenant-1");
    expect(slugs).toContain("test-tenant-2");
    expect(slugs).toContain("test-tenant-3");
  });

  it("deve retornar tenants ordenados por data de criação (mais recentes primeiro)", async () => {
    // Criar tenants com pequeno delay para garantir diferentes timestamps
    const tenant1: CreateTenantInput = {
      name: "Test Tenant First",
      slug: "test-tenant-first",
      user: {
        email: "test-first@example.com",
        password: "senhaSegura123",
      },
    };

    await TenantService.create(tenant1);

    // Pequeno delay para garantir timestamp diferente
    await new Promise((resolve) => setTimeout(resolve, 10));

    const tenant2: CreateTenantInput = {
      name: "Test Tenant Second",
      slug: "test-tenant-second",
      user: {
        email: "test-second@example.com",
        password: "senhaSegura123",
      },
    };

    await TenantService.create(tenant2);

    const tenants = await TenantService.getAllTenants();

    // Verificar ordenação (mais recentes primeiro)
    expect(tenants.length).toBeGreaterThanOrEqual(2);
    const firstTenant = tenants.find((t) => t.slug === "test-tenant-second");
    const secondTenant = tenants.find((t) => t.slug === "test-tenant-first");

    expect(firstTenant).toBeDefined();
    expect(secondTenant).toBeDefined();

    // O tenant mais recente deve aparecer primeiro
    const firstIndex = tenants.findIndex((t) => t.slug === "test-tenant-second");
    const secondIndex = tenants.findIndex((t) => t.slug === "test-tenant-first");

    expect(firstIndex).toBeLessThan(secondIndex);
  });
});

