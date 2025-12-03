/**
 * Testes para schemas de validação do Tenant
 */

import { describe, it, expect } from "vitest";
import { tenantSearchSchema } from "./tenant.schema";

describe("Tenant Search Schema", () => {
  describe("Validação de query", () => {
    it("deve aceitar query válida", () => {
      const result = tenantSearchSchema.safeParse({ query: "test" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe("test");
      }
    });

    it("deve rejeitar query vazia", () => {
      const result = tenantSearchSchema.safeParse({ query: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("vazia");
      }
    });

    it("deve rejeitar query com apenas espaços", () => {
      const result = tenantSearchSchema.safeParse({ query: "   " });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("vazia");
      }
    });

    it("deve rejeitar query muito longa (> 100 caracteres)", () => {
      const longQuery = "a".repeat(101);
      const result = tenantSearchSchema.safeParse({ query: longQuery });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("100 caracteres");
      }
    });

    it("deve aceitar query no limite (100 caracteres)", () => {
      const maxQuery = "a".repeat(100);
      const result = tenantSearchSchema.safeParse({ query: maxQuery });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar quando query está faltando", () => {
      const result = tenantSearchSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("obrigatória");
      }
    });

    it("deve rejeitar quando query é null", () => {
      const result = tenantSearchSchema.safeParse({ query: null });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar quando query é undefined", () => {
      const result = tenantSearchSchema.safeParse({ query: undefined });
      expect(result.success).toBe(false);
    });

    it("deve fazer trim da query", () => {
      const result = tenantSearchSchema.safeParse({ query: "  test  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe("test");
      }
    });
  });
});
