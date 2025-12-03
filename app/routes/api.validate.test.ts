/**
 * Testes para a rota de API de validação de licença
 * 
 * Este arquivo contém testes para o endpoint /api/validate que valida
 * licenças e retorna as capabilities disponíveis.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loader, headers } from "./api.validate";
import { validateAccess } from "../domains/license/license.engine";
import type { ValidateAccessOutput } from "../domains/license/license.types";
import { LICENSE_VALIDATION_CACHE_CONTROL } from "../core/constants/cache-control.constants";

// Mock do validateAccess
vi.mock("../domains/license/license.engine", () => ({
  validateAccess: vi.fn(),
}));

describe("API Route: /api/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validação de Parâmetros", () => {
    it("deve retornar 400 quando licenseKey está faltando", async () => {
      // Arrange
      const request = new Request("http://localhost/api/validate", {
        method: "GET",
        headers: {
          Origin: "https://example.com",
        },
      });

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: "Missing licenseKey query parameter",
      });
    });

    it("deve retornar 400 quando Origin header está faltando", async () => {
      // Arrange
      const request = new Request(
        "http://localhost/api/validate?licenseKey=test-key",
        {
          method: "GET",
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: "Missing Origin header",
      });
    });

    it("deve aceitar Origin header em minúsculas", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: true,
        capabilities: ["FEATURE_1"],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=test-key",
        {
          method: "GET",
          headers: {
            origin: "https://example.com", // minúsculas
          },
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.status).toBe(200);
      expect(vi.mocked(validateAccess)).toHaveBeenCalledWith({
        licenseKey: "test-key",
        origin: "https://example.com",
      });
    });
  });

  describe("Validação de Licença Válida", () => {
    it("deve retornar 200 com capabilities quando licenseKey é válido", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: true,
        capabilities: ["COUPONS", "WHATSAPP", "EMAIL"],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=valid-key",
        {
          method: "GET",
          headers: {
            Origin: "https://example.com",
          },
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        valid: true,
        capabilities: ["COUPONS", "WHATSAPP", "EMAIL"],
      });

      // Verificar que validateAccess foi chamado corretamente
      expect(vi.mocked(validateAccess)).toHaveBeenCalledWith({
        licenseKey: "valid-key",
        origin: "https://example.com",
      });

      // Verificar headers CORS
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Origin");
    });

    it("deve retornar 200 com capabilities vazias quando licenseKey é válido mas não tem features", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: true,
        capabilities: [],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=valid-key-no-features",
        {
          method: "GET",
          headers: {
            Origin: "https://example.com",
          },
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        valid: true,
        capabilities: [],
      });
    });
  });

  describe("Validação de Licença Inválida", () => {
    it("deve retornar 403 quando licenseKey é inválido", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: false,
        capabilities: [],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=invalid-key",
        {
          method: "GET",
          headers: {
            Origin: "https://example.com",
          },
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        valid: false,
        capabilities: [],
      });

      // Verificar headers CORS
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Origin");
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve retornar 500 quando validateAccess lança um erro", async () => {
      // Arrange
      const error = new Error("Database connection failed");
      vi.mocked(validateAccess).mockRejectedValue(error);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=test-key",
        {
          method: "GET",
          headers: {
            Origin: "https://example.com",
          },
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: "Internal server error",
        valid: false,
        capabilities: [],
      });

      // Verificar que o erro foi logado (console.error seria chamado)
      expect(vi.mocked(validateAccess)).toHaveBeenCalled();
    });
  });

  describe("Formato de Resposta", () => {
    it("deve retornar Content-Type application/json em todas as respostas", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: true,
        capabilities: ["FEATURE_1"],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=test-key",
        {
          method: "GET",
          headers: {
            Origin: "https://example.com",
          },
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("deve retornar JSON válido em todas as respostas", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: true,
        capabilities: ["FEATURE_1", "FEATURE_2"],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=test-key",
        {
          method: "GET",
          headers: {
            Origin: "https://example.com",
          },
        }
      );

      // Act
      const response = await loader({ request } as any);
      const body = await response.json();

      // Assert
      expect(typeof body).toBe("object");
      expect(body).toHaveProperty("valid");
      expect(body).toHaveProperty("capabilities");
      expect(Array.isArray(body.capabilities)).toBe(true);
    });
  });

  describe("CORS Headers", () => {
    it("deve incluir headers CORS em resposta 200", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: true,
        capabilities: ["FEATURE_1"],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=test-key",
        {
          method: "GET",
          headers: {
            Origin: "https://example.com",
          },
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Origin");
    });

    it("deve incluir headers CORS em resposta 403", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: false,
        capabilities: [],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=invalid-key",
        {
          method: "GET",
          headers: {
            Origin: "https://example.com",
          },
        }
      );

      // Act
      const response = await loader({ request } as any);

      // Assert
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Origin");
    });
  });

  describe("Chamada de validateAccess", () => {
    it("deve chamar validateAccess com licenseKey e origin corretos", async () => {
      // Arrange
      const mockResult: ValidateAccessOutput = {
        valid: true,
        capabilities: [],
      };

      vi.mocked(validateAccess).mockResolvedValue(mockResult);

      const request = new Request(
        "http://localhost/api/validate?licenseKey=my-license-key",
        {
          method: "GET",
          headers: {
            Origin: "https://my-domain.com",
          },
        }
      );

      // Act
      await loader({ request } as any);

      // Assert
      expect(vi.mocked(validateAccess)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(validateAccess)).toHaveBeenCalledWith({
        licenseKey: "my-license-key",
        origin: "https://my-domain.com",
      });
    });

    it("deve não chamar validateAccess quando licenseKey está faltando", async () => {
      // Arrange
      const request = new Request("http://localhost/api/validate", {
        method: "GET",
        headers: {
          Origin: "https://example.com",
        },
      });

      // Act
      await loader({ request } as any);

      // Assert
      expect(vi.mocked(validateAccess)).not.toHaveBeenCalled();
    });

    it("deve não chamar validateAccess quando Origin está faltando", async () => {
      // Arrange
      const request = new Request(
        "http://localhost/api/validate?licenseKey=test-key",
        {
          method: "GET",
        }
      );

      // Act
      await loader({ request } as any);

      // Assert
      expect(vi.mocked(validateAccess)).not.toHaveBeenCalled();
    });
  });

  describe("Headers Function: Cache-Control", () => {
    it("deve adicionar Cache-Control header para respostas de sucesso (200)", () => {
      // Arrange
      const loaderHeaders = new Headers({
        "Content-Type": "application/json",
        "X-License-Valid": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Origin",
      });

      // Act
      const result = headers({ loaderHeaders } as any);

      // Assert
      expect(result.get("Cache-Control")).toBe(LICENSE_VALIDATION_CACHE_CONTROL);
      // Verificar que outros headers foram preservados
      expect(result.get("Content-Type")).toBe("application/json");
      expect(result.get("X-License-Valid")).toBe("true");
      expect(result.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("não deve adicionar Cache-Control header para respostas de erro (403)", () => {
      // Arrange
      const loaderHeaders = new Headers({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Origin",
        // Sem X-License-Valid header (indica erro)
      });

      // Act
      const result = headers({ loaderHeaders } as any);

      // Assert
      expect(result.get("Cache-Control")).toBeNull();
      // Verificar que outros headers foram preservados
      expect(result.get("Content-Type")).toBe("application/json");
      expect(result.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("não deve adicionar Cache-Control header para respostas de erro (400)", () => {
      // Arrange
      const loaderHeaders = new Headers({
        "Content-Type": "application/json",
        // Sem X-License-Valid header e sem CORS headers (indica erro 400)
      });

      // Act
      const result = headers({ loaderHeaders } as any);

      // Assert
      expect(result.get("Cache-Control")).toBeNull();
      expect(result.get("Content-Type")).toBe("application/json");
    });

    it("não deve adicionar Cache-Control header para respostas de erro (500)", () => {
      // Arrange
      const loaderHeaders = new Headers({
        "Content-Type": "application/json",
        // Sem X-License-Valid header (indica erro 500)
      });

      // Act
      const result = headers({ loaderHeaders } as any);

      // Assert
      expect(result.get("Cache-Control")).toBeNull();
      expect(result.get("Content-Type")).toBe("application/json");
    });

    it("deve preservar todos os headers originais do loader", () => {
      // Arrange
      const loaderHeaders = new Headers({
        "Content-Type": "application/json",
        "X-License-Valid": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Origin",
        "X-Custom-Header": "custom-value",
      });

      // Act
      const result = headers({ loaderHeaders } as any);

      // Assert
      // Verificar que todos os headers originais foram preservados
      expect(result.get("Content-Type")).toBe("application/json");
      expect(result.get("X-License-Valid")).toBe("true");
      expect(result.get("Access-Control-Allow-Origin")).toBe("*");
      expect(result.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(result.get("Access-Control-Allow-Headers")).toBe("Origin");
      expect(result.get("X-Custom-Header")).toBe("custom-value");
      // Verificar que Cache-Control foi adicionado
      expect(result.get("Cache-Control")).toBe(
        "public, max-age=600, stale-while-revalidate=3600"
      );
    });
  });
});

