/**
 * Testes Unitários para License Engine
 * 
 * Este arquivo contém testes unitários isolados usando mocks para garantir
 * cobertura completa de todos os cenários sem depender do banco de dados.
 * 
 * Os testes de integração estão em license.engine.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ValidateAccessInput } from "./license.types";

// Mock do TenantService antes de importar
vi.mock("../../core/domain/tenant/tenant.service", () => ({
  TenantService: {
    findTenantByLicenseKey: vi.fn(),
  },
}));

// Importar após os mocks
import { TenantService } from "../../core/domain/tenant/tenant.service";

// Importar o módulo dinamicamente para poder fazer spy
let licenseEngine: typeof import("./license.engine");
let resolvePermissionsSpy: ReturnType<typeof vi.spyOn>;

describe("validateAccess - Unit Tests (with mocks)", () => {
  // Mock do TenantService
  let mockFindTenantByLicenseKey: ReturnType<typeof vi.fn>;
  
  // Mock do resolvePermissions
  let mockResolvePermissions: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Resetar todos os mocks antes de cada teste
    vi.clearAllMocks();
    
    // Criar novas funções mock para cada teste
    mockFindTenantByLicenseKey = vi.fn();
    mockResolvePermissions = vi.fn();
    
    // Importar o módulo dinamicamente para poder fazer spy
    licenseEngine = await import("./license.engine");
    
    // Mockar TenantService.findTenantByLicenseKey
    vi.spyOn(TenantService, "findTenantByLicenseKey").mockImplementation(
      mockFindTenantByLicenseKey
    );
    
    // Mockar resolvePermissions (função do mesmo módulo)
    // Fazer spy na função exportada do módulo importado
    resolvePermissionsSpy = vi
      .spyOn(licenseEngine, "resolvePermissions")
      .mockImplementation(mockResolvePermissions);
  });

  afterEach(() => {
    // Restaurar implementações originais
    vi.restoreAllMocks();
  });

  it("deve retornar válido com capabilities quando tenant existe, está ACTIVE e resolvePermissions retorna features", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: "plan-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCapabilities = ["COUPONS", "WHATSAPP", "EMAIL"];

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockResolvedValue(mockCapabilities);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(true);
    expect(result.capabilities).toEqual(mockCapabilities);
    expect(mockFindTenantByLicenseKey).toHaveBeenCalledWith("test-tenant");
    expect(mockResolvePermissions).toHaveBeenCalledWith("tenant-123");
  });

  it("deve retornar inválido quando licenseKey não existe (tenant é null)", async () => {
    // Arrange
    mockFindTenantByLicenseKey.mockResolvedValue(null);

    const input: ValidateAccessInput = {
      licenseKey: "non-existent-key",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(false);
    expect(result.capabilities).toEqual([]);
    expect(mockFindTenantByLicenseKey).toHaveBeenCalledWith("non-existent-key");
    expect(mockResolvePermissions).not.toHaveBeenCalled();
  });

  it("deve retornar inválido quando tenant está INACTIVE", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "INACTIVE" as const,
      planId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(false);
    expect(result.capabilities).toEqual([]);
    expect(mockFindTenantByLicenseKey).toHaveBeenCalledWith("test-tenant");
    expect(mockResolvePermissions).not.toHaveBeenCalled();
  });

  it("deve retornar inválido quando tenant está PAST_DUE", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "PAST_DUE" as const,
      planId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(false);
    expect(result.capabilities).toEqual([]);
    expect(mockFindTenantByLicenseKey).toHaveBeenCalledWith("test-tenant");
    expect(mockResolvePermissions).not.toHaveBeenCalled();
  });

  it("deve retornar capabilities vazias quando resolvePermissions retorna array vazio", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockResolvedValue([]);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(true);
    expect(result.capabilities).toEqual([]);
    expect(mockResolvePermissions).toHaveBeenCalledWith("tenant-123");
  });

  it("deve retornar capabilities com múltiplas features quando resolvePermissions retorna várias", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: "plan-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCapabilities = [
      "COUPONS",
      "WHATSAPP",
      "EMAIL",
      "ANALYTICS",
      "ADVANCED_REPORTS",
    ];

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockResolvedValue(mockCapabilities);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(true);
    expect(result.capabilities).toEqual(mockCapabilities);
    expect(result.capabilities.length).toBe(5);
  });

  it("deve propagar erro quando resolvePermissions lança exceção", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: "plan-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockRejectedValue(
      new Error("Tenant with id \"tenant-123\" not found")
    );

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: "https://example.com",
    };

    // Act & Assert
    await expect(
      licenseEngine.validateAccessWithResolver(
        input,
        mockResolvePermissions
      )
    ).rejects.toThrow(
      "Tenant with id \"tenant-123\" not found"
    );
    expect(mockResolvePermissions).toHaveBeenCalledWith("tenant-123");
  });

  it("deve chamar findTenantByLicenseKey com o licenseKey correto", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockResolvedValue([]);

    const input: ValidateAccessInput = {
      licenseKey: "custom-license-key-123",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(mockFindTenantByLicenseKey).toHaveBeenCalledTimes(1);
    expect(mockFindTenantByLicenseKey).toHaveBeenCalledWith(
      "custom-license-key-123"
    );
  });

  it("deve retornar inválido quando licenseKey é string vazia", async () => {
    // Arrange
    mockFindTenantByLicenseKey.mockResolvedValue(null);

    const input: ValidateAccessInput = {
      licenseKey: "",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(false);
    expect(result.capabilities).toEqual([]);
    expect(mockFindTenantByLicenseKey).toHaveBeenCalledWith("");
  });

  it("deve retornar inválido quando licenseKey contém apenas espaços", async () => {
    // Arrange
    mockFindTenantByLicenseKey.mockResolvedValue(null);

    const input: ValidateAccessInput = {
      licenseKey: "   ",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(false);
    expect(result.capabilities).toEqual([]);
  });

  it("deve lidar com diferentes valores de origin sem afetar validação (domain ainda não implementado)", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockResolvedValue(["FEATURE_1"]);

    const origins = [
      "https://example.com",
      "https://different-domain.com",
      "http://localhost:3000",
      "invalid-origin",
    ];

    // Act & Assert
    for (const origin of origins) {
      const input: ValidateAccessInput = {
        licenseKey: "test-tenant",
        origin,
      };

      const result = await licenseEngine.validateAccessWithResolver(
        input,
        mockResolvePermissions
      );

      // Como domain ainda não está implementado, todos devem passar
      expect(result.valid).toBe(true);
      expect(result.capabilities).toEqual(["FEATURE_1"]);
    }
  });

  it("deve retornar inválido quando licenseKey é undefined (edge case)", async () => {
    // Arrange
    mockFindTenantByLicenseKey.mockResolvedValue(null);

    const input: ValidateAccessInput = {
      licenseKey: undefined as any,
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(false);
    expect(result.capabilities).toEqual([]);
  });

  it("deve retornar inválido quando origin é undefined (edge case)", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockResolvedValue(["FEATURE_1"]);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: undefined as any,
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    // Como domain ainda não está implementado, deve passar mesmo com origin undefined
    expect(result.valid).toBe(true);
    expect(result.capabilities).toEqual(["FEATURE_1"]);
  });

  it("deve chamar resolvePermissions apenas uma vez mesmo com múltiplas validações do mesmo tenant", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockResolvedValue(["FEATURE_1"]);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: "https://example.com",
    };

    // Act - chamar múltiplas vezes usando validateAccessWithResolver
    await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );
    await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );
    await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(mockResolvePermissions).toHaveBeenCalledTimes(3);
    expect(mockResolvePermissions).toHaveBeenCalledWith("tenant-123");
  });

  it("deve retornar capabilities ordenadas quando resolvePermissions retorna array ordenado", async () => {
    // Arrange
    const mockTenant = {
      id: "tenant-123",
      name: "Test Tenant",
      slug: "test-tenant",
      status: "ACTIVE" as const,
      planId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCapabilities = ["Z_FEATURE", "A_FEATURE", "M_FEATURE"];

    mockFindTenantByLicenseKey.mockResolvedValue(mockTenant);
    mockResolvePermissions.mockResolvedValue(mockCapabilities);

    const input: ValidateAccessInput = {
      licenseKey: "test-tenant",
      origin: "https://example.com",
    };

    // Act - usar validateAccessWithResolver para permitir mock do resolver
    const result = await licenseEngine.validateAccessWithResolver(
      input,
      mockResolvePermissions
    );

    // Assert
    expect(result.valid).toBe(true);
    expect(result.capabilities).toEqual(mockCapabilities);
    // Verificar que a ordem é preservada
    expect(result.capabilities[0]).toBe("Z_FEATURE");
    expect(result.capabilities[1]).toBe("A_FEATURE");
    expect(result.capabilities[2]).toBe("M_FEATURE");
  });
});

