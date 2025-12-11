/**
 * Integration Tests for License Validation API
 * 
 * These tests verify the end-to-end behavior of the /api/validate endpoint
 * by making actual HTTP requests to a running server instance.
 * 
 * These tests simulate the "Phone Home" behavior from external applications.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../helpers/test-server";
import { prisma } from "../../app/core/db/prisma.server";
import { TenantService } from "../../app/core/domain/tenant/tenant.service";
import type { CreateTenantInput } from "../../app/core/domain/tenant/tenant.schema";
import type { Express } from "express";

describe("Integration Tests: /api/validate", () => {
  let app: Express;
  let testTenant: { id: string; slug: string };

  // Setup: Create test server before all tests
  beforeAll(async () => {
    app = await createTestApp();
  });

  // Cleanup: Remove test data after each test
  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.tenantFeature.deleteMany({
      where: {
        tenant: {
          slug: { startsWith: "test-" },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: "@test-integration.com" },
      },
    });
    await prisma.tenant.deleteMany({
      where: {
        slug: { startsWith: "test-" },
      },
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.tenantFeature.deleteMany({
      where: {
        tenant: {
          slug: { startsWith: "test-" },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: "@test-integration.com" },
      },
    });
    await prisma.tenant.deleteMany({
      where: {
        slug: { startsWith: "test-" },
      },
    });
  });

  describe("Valid License Key", () => {
    it("deve retornar 200 com valid: true quando licenseKey é válido e tenant está ACTIVE", async () => {
      // Arrange: Create a test tenant with ACTIVE status
      const timestamp = Date.now();
      const tenantData: CreateTenantInput = {
        name: "Test Tenant Integration",
        slug: `test-integration-${timestamp}`,
        status: "ACTIVE",
        user: {
          email: `test-integration-${timestamp}@test-integration.com`,
          password: "senhaSegura123",
        },
      };

      const createdTenant = await TenantService.create(tenantData);
      testTenant = {
        id: createdTenant.id,
        slug: createdTenant.slug,
      };

      // Act: Make HTTP request to /api/validate
      const response = await request(app)
        .get(`/api/validate?licenseKey=${testTenant.slug}`)
        .set("Origin", "https://example.com");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("valid", true);
      expect(response.body).toHaveProperty("capabilities");
      expect(Array.isArray(response.body.capabilities)).toBe(true);
      expect(response.headers["content-type"]).toContain("application/json");
      // Note: Cache-Control header is set by the headers() function in the route
      // In integration tests, this may not always be captured by supertest
      // The header is verified in unit tests (api.validate.test.ts)
      // For integration tests, we verify the response structure and status
    });

    it("deve retornar capabilities corretas quando tenant tem plano com features", async () => {
      // Arrange: Create plan with features and tenant
      const timestamp = Date.now();

      const product = await prisma.product.create({
        data: {
          name: `Test Product ${timestamp}`,
          slug: `test-product-${timestamp}`,
          description: "Test Product",
        }
      });

      const plan = await prisma.plan.create({
        data: {
          productId: product.id,
          name: `Test Plan Integration ${timestamp}`,
          features: ["COUPONS", "WHATSAPP", "EMAIL"],
        },
      });

      const tenantData: CreateTenantInput = {
        name: "Test Tenant With Plan",
        slug: `test-plan-${timestamp}`,
        status: "ACTIVE",
        planId: plan.id,
        user: {
          email: `test-plan-${timestamp}@test-integration.com`,
          password: "senhaSegura123",
        },
      };

      const createdTenant = await TenantService.create(tenantData);

      // Act
      const response = await request(app)
        .get(`/api/validate?licenseKey=${createdTenant.slug}`)
        .set("Origin", "https://example.com");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.capabilities).toContain("COUPONS");
      expect(response.body.capabilities).toContain("WHATSAPP");
      expect(response.body.capabilities).toContain("EMAIL");
      expect(response.body.capabilities.length).toBe(3);

      // Cleanup
      // Cleanup
      await prisma.plan.delete({ where: { id: plan.id } });
      await prisma.product.delete({ where: { id: product.id } });
    });
  });

  describe("Invalid License Key", () => {
    it("deve retornar 403 com valid: false quando licenseKey não existe", async () => {
      // Act: Make request with non-existent license key
      const response = await request(app)
        .get("/api/validate?licenseKey=non-existent-key-12345")
        .set("Origin", "https://example.com");

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("valid", false);
      expect(response.body).toHaveProperty("capabilities", []);
      expect(response.headers["content-type"]).toContain("application/json");
      // Error responses should not have cache-control
      expect(response.headers["cache-control"]).toBeUndefined();
    });

    it("deve retornar 403 com valid: false quando tenant está INACTIVE", async () => {
      // Arrange: Create tenant with INACTIVE status
      const timestamp = Date.now();
      const tenantData: CreateTenantInput = {
        name: "Test Tenant Inactive",
        slug: `test-inactive-${timestamp}`,
        status: "INACTIVE",
        user: {
          email: `test-inactive-${timestamp}@test-integration.com`,
          password: "senhaSegura123",
        },
      };

      const createdTenant = await TenantService.create(tenantData);

      // Act
      const response = await request(app)
        .get(`/api/validate?licenseKey=${createdTenant.slug}`)
        .set("Origin", "https://example.com");

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.valid).toBe(false);
      expect(response.body.capabilities).toEqual([]);
    });

    it("deve retornar 403 com valid: false quando tenant está PAST_DUE", async () => {
      // Arrange: Create tenant with PAST_DUE status
      const timestamp = Date.now();
      const tenantData: CreateTenantInput = {
        name: "Test Tenant Past Due",
        slug: `test-past-due-${timestamp}`,
        status: "PAST_DUE",
        user: {
          email: `test-past-due-${timestamp}@test-integration.com`,
          password: "senhaSegura123",
        },
      };

      const createdTenant = await TenantService.create(tenantData);

      // Act
      const response = await request(app)
        .get(`/api/validate?licenseKey=${createdTenant.slug}`)
        .set("Origin", "https://example.com");

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.valid).toBe(false);
      expect(response.body.capabilities).toEqual([]);
    });
  });

  describe("Request Validation", () => {
    it("deve retornar 400 quando licenseKey está faltando", async () => {
      // Act
      const response = await request(app)
        .get("/api/validate")
        .set("Origin", "https://example.com");

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("licenseKey");
    });

    it("deve retornar 400 quando Origin header está faltando", async () => {
      // Act
      const response = await request(app)
        .get("/api/validate?licenseKey=test-key");

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Origin");
    });

    it("deve aceitar Origin header em minúsculas", async () => {
      // Arrange: Create test tenant
      const timestamp = Date.now();
      const tenantData: CreateTenantInput = {
        name: "Test Tenant Origin",
        slug: `test-origin-${timestamp}`,
        status: "ACTIVE",
        user: {
          email: `test-origin-${timestamp}@test-integration.com`,
          password: "senhaSegura123",
        },
      };

      const createdTenant = await TenantService.create(tenantData);

      // Act: Use lowercase "origin" header
      const response = await request(app)
        .get(`/api/validate?licenseKey=${createdTenant.slug}`)
        .set("origin", "https://example.com");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });
  });

  describe("CORS Headers", () => {
    it("deve incluir headers CORS em respostas de sucesso", async () => {
      // Arrange
      const timestamp = Date.now();
      const tenantData: CreateTenantInput = {
        name: "Test Tenant CORS",
        slug: `test-cors-${timestamp}`,
        status: "ACTIVE",
        user: {
          email: `test-cors-${timestamp}@test-integration.com`,
          password: "senhaSegura123",
        },
      };

      const createdTenant = await TenantService.create(tenantData);

      // Act
      const response = await request(app)
        .get(`/api/validate?licenseKey=${createdTenant.slug}`)
        .set("Origin", "https://example.com");

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["access-control-allow-methods"]).toBe("GET");
      expect(response.headers["access-control-allow-headers"]).toBe("Origin");
    });

    it("deve incluir headers CORS em respostas de erro (403)", async () => {
      // Act
      const response = await request(app)
        .get("/api/validate?licenseKey=invalid-key")
        .set("Origin", "https://example.com");

      // Assert
      expect(response.status).toBe(403);
      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["access-control-allow-methods"]).toBe("GET");
      expect(response.headers["access-control-allow-headers"]).toBe("Origin");
    });
  });
});

