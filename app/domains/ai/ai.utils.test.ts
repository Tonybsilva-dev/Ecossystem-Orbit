/**
 * Unit Tests for AI Client Utilities
 *
 * Tests for the log sanitization utility function.
 */

import { describe, it, expect } from "vitest";
import { sanitizeLogObject } from "./ai.utils";

describe("sanitizeLogObject", () => {
  describe("Authorization Header Redaction", () => {
    it("deve redactar header Authorization no top level", () => {
      const logData = {
        headers: {
          Authorization: "Bearer sk-1234567890abcdef",
          "Content-Type": "application/json",
        },
        body: { message: "Hello" },
      };

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      expect(sanitized.headers.Authorization).toBe("[REDACTED]");
      expect(sanitized.headers["Content-Type"]).toBe("application/json");
      expect(sanitized.body.message).toBe("Hello");
    });

    it("deve redactar header Authorization case-insensitive", () => {
      const logData = {
        headers: {
          authorization: "Bearer sk-1234567890abcdef",
          AUTHORIZATION: "Bearer sk-abcdef1234567890",
          "Content-Type": "application/json",
        },
      };

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      expect(sanitized.headers.authorization).toBe("[REDACTED]");
      expect(sanitized.headers.AUTHORIZATION).toBe("[REDACTED]");
      expect(sanitized.headers["Content-Type"]).toBe("application/json");
    });
  });

  describe("Nested Sensitive Data", () => {
    it("deve redactar chaves sensíveis em objetos aninhados profundamente", () => {
      const logData = {
        level1: {
          level2: {
            level3: {
              apiKey: "secret-key-123",
              password: "my-password",
              normalField: "normal-value",
            },
          },
        },
      };

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      expect(sanitized.level1.level2.level3.apiKey).toBe("[REDACTED]");
      expect(sanitized.level1.level2.level3.password).toBe("[REDACTED]");
      expect(sanitized.level1.level2.level3.normalField).toBe("normal-value");
    });

    it("deve redactar múltiplas chaves sensíveis em diferentes níveis", () => {
      const logData = {
        topLevel: {
          token: "top-token-123",
          nested: {
            secret: "nested-secret-456",
            deeper: {
              api_key: "deep-api-key-789",
            },
          },
        },
      };

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      expect(sanitized.topLevel.token).toBe("[REDACTED]");
      expect(sanitized.topLevel.nested.secret).toBe("[REDACTED]");
      expect((sanitized.topLevel.nested.deeper as any).api_key).toBe(
        "[REDACTED]"
      );
    });
  });

  describe("Arrays", () => {
    it("deve sanitizar objetos dentro de arrays", () => {
      const logData = [
        {
          id: 1,
          apiKey: "key-1",
          name: "Item 1",
        },
        {
          id: 2,
          password: "pass-2",
          name: "Item 2",
        },
      ];

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      expect(sanitized[0].apiKey).toBe("[REDACTED]");
      expect(sanitized[0].name).toBe("Item 1");
      expect(sanitized[1].password).toBe("[REDACTED]");
      expect(sanitized[1].name).toBe("Item 2");
    });

    it("deve sanitizar arrays aninhados", () => {
      // Usar 'auth' em vez de 'credentials' porque 'credentials' está na lista de chaves sensíveis
      const logData = {
        items: [
          {
            auth: {
              username: "user1",
              password: "pass1",
            },
          },
          {
            auth: {
              username: "user2",
              token: "token2",
            },
          },
        ],
      };

      const sanitized = sanitizeLogObject(logData) as any;

      // Verificar estrutura
      expect(sanitized).toBeDefined();
      expect(sanitized.items).toBeDefined();
      expect(Array.isArray(sanitized.items)).toBe(true);
      expect(sanitized.items.length).toBe(2);

      // Verificar primeiro item
      const firstItem = sanitized.items[0];
      expect(firstItem).toBeDefined();
      expect(firstItem.auth).toBeDefined();
      expect(firstItem.auth.password).toBe("[REDACTED]");
      expect(firstItem.auth.username).toBe("user1");

      // Verificar segundo item
      const secondItem = sanitized.items[1];
      expect(secondItem).toBeDefined();
      expect(secondItem.auth).toBeDefined();
      expect(secondItem.auth.token).toBe("[REDACTED]");
      expect(secondItem.auth.username).toBe("user2");
    });
  });

  describe("Non-Sensitive Data", () => {
    it("deve manter objeto inalterado se não houver dados sensíveis", () => {
      const logData = {
        message: "Hello World",
        status: 200,
        data: {
          userId: "user-123",
          timestamp: "2024-01-01T00:00:00Z",
        },
      };

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      expect(sanitized).toEqual(logData);
      expect(sanitized.message).toBe("Hello World");
      expect(sanitized.status).toBe(200);
      expect(sanitized.data.userId).toBe("user-123");
    });
  });

  describe("Primitives and Special Types", () => {
    it("deve retornar primitivos inalterados", () => {
      expect(sanitizeLogObject("string")).toBe("string");
      expect(sanitizeLogObject(123)).toBe(123);
      expect(sanitizeLogObject(true)).toBe(true);
      expect(sanitizeLogObject(null)).toBe(null);
      expect(sanitizeLogObject(undefined)).toBe(undefined);
    });

    it("deve clonar objetos Date", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const sanitized = sanitizeLogObject(date) as Date;

      expect(sanitized).toBeInstanceOf(Date);
      expect(sanitized.getTime()).toBe(date.getTime());
      expect(sanitized).not.toBe(date); // Deve ser uma nova instância
    });
  });

  describe("Custom Sensitive Keys", () => {
    it("deve aceitar lista customizada de chaves sensíveis", () => {
      const logData = {
        customKey: "should-be-redacted",
        anotherKey: "should-also-be-redacted",
        normalKey: "should-remain",
      };

      const sanitized = sanitizeLogObject(logData, [
        "customKey",
        "anotherKey",
      ]) as typeof logData;

      expect(sanitized.customKey).toBe("[REDACTED]");
      expect(sanitized.anotherKey).toBe("[REDACTED]");
      expect(sanitized.normalKey).toBe("should-remain");
    });

    it("deve usar chaves customizadas case-insensitive", () => {
      const logData = {
        CustomKey: "should-be-redacted",
        CUSTOMKEY: "should-also-be-redacted",
        customkey: "should-also-be-redacted-lower",
        normalKey: "should-remain",
      };

      const sanitized = sanitizeLogObject(logData, ["customkey"]) as typeof logData;

      expect(sanitized.CustomKey).toBe("[REDACTED]");
      expect(sanitized.CUSTOMKEY).toBe("[REDACTED]");
      expect(sanitized.customkey).toBe("[REDACTED]");
      expect(sanitized.normalKey).toBe("should-remain");
    });
  });

  describe("Immutability", () => {
    it("não deve mutar o objeto original", () => {
      const logData = {
        headers: {
          Authorization: "Bearer sk-1234567890",
          "Content-Type": "application/json",
        },
      };

      const originalAuth = logData.headers.Authorization;
      const sanitized = sanitizeLogObject(logData) as typeof logData;

      // Objeto original não deve ser alterado
      expect(logData.headers.Authorization).toBe(originalAuth);
      expect(logData.headers.Authorization).toBe("Bearer sk-1234567890");

      // Objeto sanitizado deve ter valores redactados
      expect(sanitized.headers.Authorization).toBe("[REDACTED]");
    });

    it("deve criar deep clone de objetos aninhados", () => {
      const logData = {
        level1: {
          level2: {
            apiKey: "secret-key",
          },
        },
      };

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      // Modificar objeto sanitizado não deve afetar o original
      (sanitized.level1.level2 as any).apiKey = "modified";

      expect(logData.level1.level2.apiKey).toBe("secret-key");
      expect((sanitized.level1.level2 as any).apiKey).toBe("modified");
    });
  });

  describe("Edge Cases", () => {
    it("deve lidar com objeto vazio", () => {
      const logData = {};
      const sanitized = sanitizeLogObject(logData);

      expect(sanitized).toEqual({});
      expect(sanitized).not.toBe(logData); // Deve ser um novo objeto
    });

    it("deve lidar com array vazio", () => {
      const logData: unknown[] = [];
      const sanitized = sanitizeLogObject(logData) as unknown[];

      expect(sanitized).toEqual([]);
      expect(sanitized).not.toBe(logData); // Deve ser um novo array
    });

    it("deve lidar com objeto com apenas chaves sensíveis", () => {
      const logData = {
        authorization: "Bearer token",
        password: "secret",
        apiKey: "key",
      };

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      expect(sanitized.authorization).toBe("[REDACTED]");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.apiKey).toBe("[REDACTED]");
    });
  });

  describe("Default Sensitive Keys", () => {
    it("deve redactar todas as chaves sensíveis padrão", () => {
      const logData = {
        authorization: "Bearer token",
        apiKey: "key-123",
        api_key: "key-456",
        "api-key": "key-789",
        password: "pass-123",
        secret: "secret-123",
        token: "token-123",
        access_token: "access-123",
        refresh_token: "refresh-123",
        private_key: "private-123",
        privatekey: "private-456",
        "private-key": "private-789",
        credential: "cred-123",
        credentials: "creds-123",
        normalField: "normal-value",
      };

      const sanitized = sanitizeLogObject(logData) as typeof logData;

      expect(sanitized.authorization).toBe("[REDACTED]");
      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.api_key).toBe("[REDACTED]");
      expect((sanitized as any)["api-key"]).toBe("[REDACTED]");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.secret).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.access_token).toBe("[REDACTED]");
      expect(sanitized.refresh_token).toBe("[REDACTED]");
      expect(sanitized.private_key).toBe("[REDACTED]");
      expect(sanitized.privatekey).toBe("[REDACTED]");
      expect((sanitized as any)["private-key"]).toBe("[REDACTED]");
      expect(sanitized.credential).toBe("[REDACTED]");
      expect(sanitized.credentials).toBe("[REDACTED]");
      expect(sanitized.normalField).toBe("normal-value");
    });
  });
});

