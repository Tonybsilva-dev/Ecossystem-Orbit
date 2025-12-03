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

// Desabilitar execução paralela para evitar conflitos com banco de dados
describe("TenantService.searchTenants", () => {
  // Limpar dados de teste após cada teste
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: "test-search-",
        },
      },
    });
    await prisma.tenant.deleteMany({
      where: {
        slug: {
          startsWith: "test-search-",
        },
      },
    });
  });

  it("deve retornar tenants que correspondem à busca por nome", async () => {
    // Arrange: Criar múltiplos tenants
    const tenant1 = await TenantService.create({
      name: "Acme Corporation",
      slug: "test-search-acme-corp",
      user: {
        email: "test-search-acme@example.com",
        password: "senhaSegura123",
      },
    });

    const tenant2 = await TenantService.create({
      name: "Beta Industries",
      slug: "test-search-beta-ind",
      user: {
        email: "test-search-beta@example.com",
        password: "senhaSegura123",
      },
    });

    const tenant3 = await TenantService.create({
      name: "Acme Solutions",
      slug: "test-search-acme-sol",
      user: {
        email: "test-search-acme-sol@example.com",
        password: "senhaSegura123",
      },
    });

    // Act: Buscar por "Acme"
    const results = await TenantService.searchTenants("Acme");

    // Assert: Deve retornar apenas tenants com "Acme" no nome
    expect(results.length).toBe(2);
    expect(results.map((t) => t.id)).toContain(tenant1.id);
    expect(results.map((t) => t.id)).toContain(tenant3.id);
    expect(results.map((t) => t.id)).not.toContain(tenant2.id);
  });

  it("deve retornar tenants que correspondem à busca por slug", async () => {
    // Arrange: Criar múltiplos tenants
    const tenant1 = await TenantService.create({
      name: "Test Company",
      slug: "test-search-enterprise",
      user: {
        email: "test-search-enterprise@example.com",
        password: "senhaSegura123",
      },
    });

    const tenant2 = await TenantService.create({
      name: "Another Company",
      slug: "test-search-startup",
      user: {
        email: "test-search-startup@example.com",
        password: "senhaSegura123",
      },
    });

    // Act: Buscar por "enterprise"
    const results = await TenantService.searchTenants("enterprise");

    // Assert: Deve retornar apenas o tenant com "enterprise" no slug
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(tenant1.id);
    expect(results[0].slug).toBe("test-search-enterprise");
  });

  it("deve fazer busca case-insensitive", async () => {
    // Arrange: Criar tenant com nome em maiúsculas
    const tenant = await TenantService.create({
      name: "ACME CORPORATION",
      slug: "test-search-acme-upper",
      user: {
        email: "test-search-acme-upper@example.com",
        password: "senhaSegura123",
      },
    });

    // Act: Buscar com minúsculas
    const results = await TenantService.searchTenants("acme");

    // Assert: Deve encontrar o tenant mesmo com case diferente
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(tenant.id);
  });

  it("deve retornar array vazio quando nenhum tenant corresponde", async () => {
    // Arrange: Criar tenant
    await TenantService.create({
      name: "Test Company",
      slug: "test-search-no-match",
      user: {
        email: "test-search-no-match@example.com",
        password: "senhaSegura123",
      },
    });

    // Act: Buscar por termo que não existe
    const results = await TenantService.searchTenants("xyz-nonexistent-123");

    // Assert: Deve retornar array vazio
    expect(results).toEqual([]);
    expect(results.length).toBe(0);
  });

  it("deve retornar resultados ordenados por nome (ascendente)", async () => {
    // Arrange: Criar tenants com nomes em ordem diferente
    const tenant1 = await TenantService.create({
      name: "Zebra Company",
      slug: "test-search-zebra",
      user: {
        email: "test-search-zebra@example.com",
        password: "senhaSegura123",
      },
    });

    const tenant2 = await TenantService.create({
      name: "Alpha Company",
      slug: "test-search-alpha",
      user: {
        email: "test-search-alpha@example.com",
        password: "senhaSegura123",
      },
    });

    const tenant3 = await TenantService.create({
      name: "Beta Company",
      slug: "test-search-beta",
      user: {
        email: "test-search-beta@example.com",
        password: "senhaSegura123",
      },
    });

    // Act: Buscar por "Company"
    const results = await TenantService.searchTenants("Company");

    // Assert: Deve retornar ordenado por nome (A, B, Z)
    expect(results.length).toBe(3);
    expect(results[0].name).toBe("Alpha Company");
    expect(results[1].name).toBe("Beta Company");
    expect(results[2].name).toBe("Zebra Company");
  });

  it("deve fazer busca parcial (substring)", async () => {
    // Arrange: Criar tenant
    const tenant = await TenantService.create({
      name: "Enterprise Solutions Inc",
      slug: "test-search-enterprise-sol",
      user: {
        email: "test-search-enterprise-sol@example.com",
        password: "senhaSegura123",
      },
    });

    // Act: Buscar por substring "prise"
    const results = await TenantService.searchTenants("prise");

    // Assert: Deve encontrar o tenant
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(tenant.id);
  });

  it("deve lançar erro quando query está vazia", async () => {
    // Act & Assert
    await expect(TenantService.searchTenants("")).rejects.toThrow();
    await expect(TenantService.searchTenants("")).rejects.toThrow(
      "vazia"
    );
  });

  it("deve lançar erro quando query contém apenas espaços", async () => {
    // Act & Assert
    await expect(TenantService.searchTenants("   ")).rejects.toThrow();
    await expect(TenantService.searchTenants("   ")).rejects.toThrow(
      "vazia"
    );
  });

  it("deve fazer trim da query antes de buscar", async () => {
    // Arrange: Criar tenant
    const tenant = await TenantService.create({
      name: "Trim Test Company",
      slug: "test-search-trim",
      user: {
        email: "test-search-trim@example.com",
        password: "senhaSegura123",
      },
    });

    // Act: Buscar com espaços no início e fim
    const results = await TenantService.searchTenants("  Trim Test  ");

    // Assert: Deve encontrar o tenant (trim aplicado)
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(tenant.id);
  });

  it("deve buscar em ambos os campos (name e slug) simultaneamente", async () => {
    // Arrange: Criar tenants onde um tem match no nome e outro no slug
    const tenant1 = await TenantService.create({
      name: "Tech Solutions",
      slug: "test-search-other",
      user: {
        email: "test-search-tech@example.com",
        password: "senhaSegura123",
      },
    });

    const tenant2 = await TenantService.create({
      name: "Other Company",
      slug: "test-search-tech-solutions",
      user: {
        email: "test-search-other@example.com",
        password: "senhaSegura123",
      },
    });

    // Act: Buscar por "tech"
    const results = await TenantService.searchTenants("tech");

    // Assert: Deve encontrar ambos (um no nome, outro no slug)
    expect(results.length).toBe(2);
    expect(results.map((t) => t.id)).toContain(tenant1.id);
    expect(results.map((t) => t.id)).toContain(tenant2.id);
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

