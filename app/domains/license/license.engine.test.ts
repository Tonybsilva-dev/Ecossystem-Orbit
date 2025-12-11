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
    // Criar Product
    const product = await prisma.product.create({
      data: { name: "Test Product", slug: "test-product" }
    });

    // Criar plano com features
    const plan = await prisma.plan.create({
      data: {
        productId: product.id,
        name: "Test Plan Basic",
        features: ["COUPONS", "WHATSAPP", "EMAIL"],
      },
    });

    // Criar tenant
    const tenantData: CreateTenantInput = {
      name: "Test Tenant With Plan",
      slug: "test-tenant-plan",
      user: {
        email: "test-plan@example.com",
        password: "senhaSegura123",
      },
    };
    const tenant = await TenantService.create(tenantData);

    // Criar Subscription
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        licenseKey: "test-license-key",
        status: "ACTIVE"
      }
    });

    // Resolver permissions usando ID da subscrição
    const permissions = await resolvePermissions(subscription.id);

    expect(permissions).toBeDefined();
    expect(Array.isArray(permissions)).toBe(true);
    expect(permissions.length).toBe(3);
    expect(permissions).toContain("COUPONS");
    expect(permissions).toContain("WHATSAPP");
    expect(permissions).toContain("EMAIL");
  });

  it("deve combinar features do plano base com overrides do tenant", async () => {
    // Criar Product
    const product = await prisma.product.create({
      data: { name: "Test Product 2", slug: "test-product-2" }
    });

    // Criar plano
    const plan = await prisma.plan.create({
      data: {
        productId: product.id,
        name: "Test Plan With Overrides",
        features: ["COUPONS", "WHATSAPP"],
      },
    });

    // Criar tenant
    const tenantData: CreateTenantInput = {
      name: "Test Tenant With Overrides",
      slug: "test-tenant-overrides",
      user: {
        email: "test-overrides@example.com",
        password: "senhaSegura123",
      },
    };
    const tenant = await TenantService.create(tenantData);

    // Adicionar feature override no Tenant
    await prisma.tenantFeature.create({
      data: {
        tenantId: tenant.id,
        feature: "ADVANCED_ANALYTICS",
      },
    });

    // Criar Subscription
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        licenseKey: "test-license-key-overrides",
        status: "ACTIVE"
      }
    });

    // Resolver permissions
    const permissions = await resolvePermissions(subscription.id);

    expect(permissions).toBeDefined();
    expect(permissions.length).toBe(3);
    expect(permissions).toContain("COUPONS");
    expect(permissions).toContain("WHATSAPP");
    expect(permissions).toContain("ADVANCED_ANALYTICS");
  });

  it("deve lançar erro quando subscription não existe", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    await expect(resolvePermissions(nonExistentId)).rejects.toThrow(
      `Subscription with id "${nonExistentId}" not found`
    );
  });
});

describe("validateAccess", () => {
  beforeEach(async () => {
    // Limpar dados de teste
    await prisma.subscription.deleteMany({
      where: { licenseKey: { startsWith: "test-" } }
    });
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
    await prisma.product.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
  });

  it("deve retornar válido com capabilities quando licenseKey é válido e status é ACTIVE", async () => {
    const product = await prisma.product.create({
      data: { name: "Test Product Valid", slug: "test-product-valid" }
    });

    const plan = await prisma.plan.create({
      data: {
        productId: product.id,
        name: "Test Plan Valid",
        features: ["COUPONS", "WHATSAPP"],
      },
    });

    const tenantData: CreateTenantInput = {
      name: "Test Tenant Valid",
      slug: "test-tenant-valid",
      status: "ACTIVE",
      user: {
        email: "test-valid@example.com",
        password: "senhaSegura123",
      },
    };
    const tenant = await TenantService.create(tenantData);

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        licenseKey: "test-license-valid",
        status: "ACTIVE"
      }
    });

    const input: ValidateAccessInput = {
      licenseKey: "test-license-valid",
      origin: "https://example.com",
    };

    const result = await validateAccess(input);

    expect(result.valid).toBe(true);
    expect(result.capabilities).toBeDefined();
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

  it("deve retornar inválido quando subscription está EXPIRED", async () => {
    const product = await prisma.product.create({
      data: { name: "Test Product Expired", slug: "test-product-expired" }
    });

    const plan = await prisma.plan.create({
      data: {
        productId: product.id,
        name: "Test Plan Expired",
        features: [],
      },
    });

    const tenantData: CreateTenantInput = {
      name: "Test Tenant Expired",
      slug: "test-tenant-expired",
      status: "ACTIVE",
      user: {
        email: "test-expired@example.com",
        password: "senhaSegura123",
      },
    };
    const tenant = await TenantService.create(tenantData);

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        licenseKey: "test-license-expired",
        status: "EXPIRED"
      }
    });

    const input: ValidateAccessInput = {
      licenseKey: "test-license-expired",
      origin: "https://example.com",
    };

    const result = await validateAccess(input);

    expect(result.valid).toBe(false);
  });
});

