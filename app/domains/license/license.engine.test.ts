import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolvePermissions } from "./license.engine";
import { prisma } from "../../core/db/prisma.server";
import { TenantService } from "../../core/domain/tenant/tenant.service";
import type { CreateTenantInput } from "../../core/domain/tenant/tenant.schema";

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

