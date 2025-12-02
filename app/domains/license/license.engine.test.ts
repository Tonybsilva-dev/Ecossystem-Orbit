import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolvePermissions, validateAccess } from "./license.engine";
import { prisma } from "../../core/db/prisma.server";
import { TenantService } from "../../core/domain/tenant/tenant.service";
import type { CreateTenantInput } from "../../core/domain/tenant/tenant.schema";
import type { ValidateAccessInput } from "./license.types";

describe("resolvePermissions", () => {
  beforeEach(async () => {
    // Limpar dados de teste
    await prisma.tenantFeature.deleteMany({
      where: {
        tenant: {
          slug: { startsWith: "test-" },
        },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
    await prisma.plan.deleteMany({
      where: { name: { startsWith: "Test Plan" } },
    });
  });

  afterEach(async () => {
    // Limpar dados de teste
    await prisma.tenantFeature.deleteMany({
      where: {
        tenant: {
          slug: { startsWith: "test-" },
        },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
    await prisma.plan.deleteMany({
      where: { name: { startsWith: "Test Plan" } },
    });
  });

  it("deve retornar features do plano base quando tenant tem apenas plano", async () => {
    // Criar plano com features
    const plan = await prisma.plan.create({
      data: {
        name: "Test Plan Basic",
        features: ["COUPONS", "WHATSAPP", "EMAIL"],
      },
    });

    // Criar tenant com plano
    const tenantData: CreateTenantInput = {
      name: "Test Tenant With Plan",
      slug: "test-tenant-plan",
      planId: plan.id,
      user: {
        email: "test-plan@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(tenantData);

    // Resolver permissions
    const permissions = await resolvePermissions(tenant.id);

    expect(permissions).toBeDefined();
    expect(Array.isArray(permissions)).toBe(true);
    expect(permissions.length).toBe(3);
    expect(permissions).toContain("COUPONS");
    expect(permissions).toContain("WHATSAPP");
    expect(permissions).toContain("EMAIL");
  });

  it("deve retornar array vazio quando tenant não tem plano", async () => {
    // Criar tenant sem plano
    const tenantData: CreateTenantInput = {
      name: "Test Tenant No Plan",
      slug: "test-tenant-no-plan",
      user: {
        email: "test-no-plan@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(tenantData);

    // Resolver permissions
    const permissions = await resolvePermissions(tenant.id);

    expect(permissions).toBeDefined();
    expect(Array.isArray(permissions)).toBe(true);
    expect(permissions.length).toBe(0);
  });

  it("deve combinar features do plano base com overrides do tenant", async () => {
    // Criar plano com features base
    const plan = await prisma.plan.create({
      data: {
        name: "Test Plan With Overrides",
        features: ["COUPONS", "WHATSAPP"],
      },
    });

    // Criar tenant com plano
    const tenantData: CreateTenantInput = {
      name: "Test Tenant With Overrides",
      slug: "test-tenant-overrides",
      planId: plan.id,
      user: {
        email: "test-overrides@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(tenantData);

    // Adicionar feature override
    await prisma.tenantFeature.create({
      data: {
        tenantId: tenant.id,
        feature: "ADVANCED_ANALYTICS",
      },
    });

    // Resolver permissions
    const permissions = await resolvePermissions(tenant.id);

    expect(permissions).toBeDefined();
    expect(permissions.length).toBe(3);
    expect(permissions).toContain("COUPONS");
    expect(permissions).toContain("WHATSAPP");
    expect(permissions).toContain("ADVANCED_ANALYTICS");
  });

  it("deve retornar apenas features de override quando tenant não tem plano", async () => {
    // Criar tenant sem plano
    const tenantData: CreateTenantInput = {
      name: "Test Tenant Only Overrides",
      slug: "test-tenant-only-overrides",
      user: {
        email: "test-only-overrides@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(tenantData);

    // Adicionar feature overrides
    await prisma.tenantFeature.create({
      data: {
        tenantId: tenant.id,
        feature: "CUSTOM_FEATURE_1",
      },
    });

    await prisma.tenantFeature.create({
      data: {
        tenantId: tenant.id,
        feature: "CUSTOM_FEATURE_2",
      },
    });

    // Resolver permissions
    const permissions = await resolvePermissions(tenant.id);

    expect(permissions).toBeDefined();
    expect(permissions.length).toBe(2);
    expect(permissions).toContain("CUSTOM_FEATURE_1");
    expect(permissions).toContain("CUSTOM_FEATURE_2");
  });

  it("deve remover duplicatas quando override repete feature do plano", async () => {
    // Criar plano com features
    const plan = await prisma.plan.create({
      data: {
        name: "Test Plan Duplicate",
        features: ["COUPONS", "WHATSAPP"],
      },
    });

    // Criar tenant com plano
    const tenantData: CreateTenantInput = {
      name: "Test Tenant Duplicate",
      slug: "test-tenant-duplicate",
      planId: plan.id,
      user: {
        email: "test-duplicate@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(tenantData);

    // Adicionar override que já existe no plano (não deve duplicar)
    await prisma.tenantFeature.create({
      data: {
        tenantId: tenant.id,
        feature: "COUPONS", // Já existe no plano
      },
    });

    // Adicionar feature nova
    await prisma.tenantFeature.create({
      data: {
        tenantId: tenant.id,
        feature: "NEW_FEATURE",
      },
    });

    // Resolver permissions
    const permissions = await resolvePermissions(tenant.id);

    expect(permissions).toBeDefined();
    expect(permissions.length).toBe(3); // COUPONS, WHATSAPP, NEW_FEATURE (sem duplicata)
    expect(permissions).toContain("COUPONS");
    expect(permissions).toContain("WHATSAPP");
    expect(permissions).toContain("NEW_FEATURE");
    // Verificar que não há duplicatas
    expect(permissions.filter((p) => p === "COUPONS").length).toBe(1);
  });

  it("deve lançar erro quando tenant não existe", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    await expect(resolvePermissions(nonExistentId)).rejects.toThrow(
      `Tenant with id "${nonExistentId}" not found`
    );
  });

  it("deve retornar features únicas mesmo com múltiplos overrides", async () => {
    // Criar plano
    const plan = await prisma.plan.create({
      data: {
        name: "Test Plan Multiple",
        features: ["BASE_FEATURE"],
      },
    });

    // Criar tenant
    const tenantData: CreateTenantInput = {
      name: "Test Tenant Multiple",
      slug: "test-tenant-multiple",
      planId: plan.id,
      user: {
        email: "test-multiple@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(tenantData);

    // Adicionar múltiplos overrides (alguns podem ser duplicados intencionalmente)
    await prisma.tenantFeature.createMany({
      data: [
        { tenantId: tenant.id, feature: "FEATURE_1" },
        { tenantId: tenant.id, feature: "FEATURE_2" },
        { tenantId: tenant.id, feature: "FEATURE_3" },
      ],
    });

    // Resolver permissions
    const permissions = await resolvePermissions(tenant.id);

    expect(permissions).toBeDefined();
    expect(permissions.length).toBe(4); // BASE_FEATURE + 3 overrides
    expect(permissions).toContain("BASE_FEATURE");
    expect(permissions).toContain("FEATURE_1");
    expect(permissions).toContain("FEATURE_2");
    expect(permissions).toContain("FEATURE_3");
  });
});

describe("validateAccess", () => {
  beforeEach(async () => {
    // Limpar dados de teste
    await prisma.tenantFeature.deleteMany({
      where: {
        tenant: {
          slug: { startsWith: "test-" },
        },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
    await prisma.plan.deleteMany({
      where: { name: { startsWith: "Test Plan" } },
    });
  });

  afterEach(async () => {
    // Limpar dados de teste
    await prisma.tenantFeature.deleteMany({
      where: {
        tenant: {
          slug: { startsWith: "test-" },
        },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
    await prisma.plan.deleteMany({
      where: { name: { startsWith: "Test Plan" } },
    });
  });

  it("deve retornar válido com capabilities quando licenseKey é válido e tenant está ACTIVE", async () => {
    // Criar plano com features
    const plan = await prisma.plan.create({
      data: {
        name: "Test Plan Valid",
        features: ["COUPONS", "WHATSAPP"],
      },
    });

    // Criar tenant com plano e status ACTIVE
    const tenantData: CreateTenantInput = {
      name: "Test Tenant Valid",
      slug: "test-tenant-valid",
      planId: plan.id,
      status: "ACTIVE",
      user: {
        email: "test-valid@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(tenantData);

    // Validar acesso usando slug como licenseKey
    const input: ValidateAccessInput = {
      licenseKey: "test-tenant-valid",
      origin: "https://example.com",
    };

    const result = await validateAccess(input);

    expect(result.valid).toBe(true);
    expect(result.capabilities).toBeDefined();
    expect(Array.isArray(result.capabilities)).toBe(true);
    expect(result.capabilities.length).toBeGreaterThan(0);
    expect(result.capabilities).toContain("COUPONS");
    expect(result.capabilities).toContain("WHATSAPP");
  });

  it("deve retornar inválido quando licenseKey não existe", async () => {
    const input: ValidateAccessInput = {
      licenseKey: "non-existent-license-key",
      origin: "https://example.com",
    };

    const result = await validateAccess(input);

    expect(result.valid).toBe(false);
    expect(result.capabilities).toBeDefined();
    expect(result.capabilities.length).toBe(0);
  });

  it("deve retornar inválido quando tenant está INACTIVE", async () => {
    // Criar tenant com status INACTIVE
    const tenantData: CreateTenantInput = {
      name: "Test Tenant Inactive",
      slug: "test-tenant-inactive",
      status: "INACTIVE",
      user: {
        email: "test-inactive@example.com",
        password: "senhaSegura123",
      },
    };

    await TenantService.create(tenantData);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant-inactive",
      origin: "https://example.com",
    };

    const result = await validateAccess(input);

    expect(result.valid).toBe(false);
    expect(result.capabilities).toBeDefined();
    expect(result.capabilities.length).toBe(0);
  });

  it("deve retornar inválido quando tenant está PAST_DUE", async () => {
    // Criar tenant com status PAST_DUE
    const tenantData: CreateTenantInput = {
      name: "Test Tenant Past Due",
      slug: "test-tenant-past-due",
      status: "PAST_DUE",
      user: {
        email: "test-past-due@example.com",
        password: "senhaSegura123",
      },
    };

    await TenantService.create(tenantData);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant-past-due",
      origin: "https://example.com",
    };

    const result = await validateAccess(input);

    expect(result.valid).toBe(false);
    expect(result.capabilities).toBeDefined();
    expect(result.capabilities.length).toBe(0);
  });

  it("deve retornar capabilities corretas incluindo overrides", async () => {
    // Criar plano com features
    const plan = await prisma.plan.create({
      data: {
        name: "Test Plan With Overrides",
        features: ["COUPONS", "WHATSAPP"],
      },
    });

    // Criar tenant com plano
    const tenantData: CreateTenantInput = {
      name: "Test Tenant With Overrides",
      slug: "test-tenant-overrides-valid",
      planId: plan.id,
      status: "ACTIVE",
      user: {
        email: "test-overrides-valid@example.com",
        password: "senhaSegura123",
      },
    };

    const tenant = await TenantService.create(tenantData);

    // Adicionar override
    await prisma.tenantFeature.create({
      data: {
        tenantId: tenant.id,
        feature: "ADVANCED_ANALYTICS",
      },
    });

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant-overrides-valid",
      origin: "https://example.com",
    };

    const result = await validateAccess(input);

    expect(result.valid).toBe(true);
    expect(result.capabilities).toContain("COUPONS");
    expect(result.capabilities).toContain("WHATSAPP");
    expect(result.capabilities).toContain("ADVANCED_ANALYTICS");
  });

  it("deve retornar array vazio de capabilities quando tenant não tem plano nem overrides", async () => {
    // Criar tenant sem plano
    const tenantData: CreateTenantInput = {
      name: "Test Tenant No Features",
      slug: "test-tenant-no-features",
      status: "ACTIVE",
      user: {
        email: "test-no-features@example.com",
        password: "senhaSegura123",
      },
    };

    await TenantService.create(tenantData);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant-no-features",
      origin: "https://example.com",
    };

    const result = await validateAccess(input);

    expect(result.valid).toBe(true); // Tenant está ACTIVE
    expect(result.capabilities).toBeDefined();
    expect(result.capabilities.length).toBe(0); // Sem features
  });
});

