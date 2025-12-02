import { describe, it, expect } from "vitest";
import {
  createTenantSchema,
  updateTenantSchema,
  tenantBaseSchema,
} from "./tenant.schema";

describe("Tenant Schema Validation", () => {
  describe("createTenantSchema", () => {
    it("deve validar dados válidos para criação de tenant", () => {
      const validData = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        planId: "123e4567-e89b-12d3-a456-426614174000",
        status: "ACTIVE" as const,
        user: {
          email: "admin@carioca.com.br",
          name: "João Silva",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Carioca Lanches");
        expect(result.data.slug).toBe("carioca-lanches");
      }
    });

    it("deve rejeitar nome vazio", () => {
      const invalidData = {
        name: "",
        slug: "carioca-lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("mínimo 3 caracteres");
      }
    });

    it("deve rejeitar nome muito curto", () => {
      const invalidData = {
        name: "AB",
        slug: "carioca-lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("mínimo 3 caracteres");
      }
    });

    it("deve rejeitar slug com espaços", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "carioca lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("kebab-case");
      }
    });

    it("deve rejeitar slug com letras maiúsculas", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "Carioca-Lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("kebab-case");
      }
    });

    it("deve rejeitar slug começando com hífen", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "-carioca-lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("começar ou terminar");
      }
    });

    it("deve rejeitar slug terminando com hífen", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "carioca-lanches-",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("começar ou terminar");
      }
    });

    it("deve rejeitar slug com hífens consecutivos", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "carioca--lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("hífens consecutivos");
      }
    });

    it("deve rejeitar planId inválido (não UUID)", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        planId: "invalid-uuid",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("UUID válido");
      }
    });

    it("deve aceitar planId como null ou undefined", () => {
      const validData1 = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        planId: null,
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const validData2 = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      expect(createTenantSchema.safeParse(validData1).success).toBe(true);
      expect(createTenantSchema.safeParse(validData2).success).toBe(true);
    });

    it("deve rejeitar email inválido", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        user: {
          email: "email-invalido",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Email inválido");
      }
    });

    it("deve rejeitar senha muito curta", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "1234567",
        },
      };

      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("mínimo 8 caracteres");
      }
    });

    it("deve aceitar nome do usuário como opcional", () => {
      const validData = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        user: {
          email: "admin@carioca.com.br",
          password: "senhaSegura123",
        },
      };

      const result = createTenantSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("updateTenantSchema", () => {
    it("deve aceitar atualização parcial com apenas alguns campos", () => {
      const partialData = {
        name: "Novo Nome",
      };

      const result = updateTenantSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("deve aceitar atualização vazia", () => {
      const emptyData = {};

      const result = updateTenantSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar campos desconhecidos", () => {
      const invalidData = {
        name: "Novo Nome",
        campoDesconhecido: "valor",
      };

      const result = updateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Com .strict(), Zod retorna erro para campos desconhecidos
        expect(result.error.errors.length).toBeGreaterThan(0);
        const firstError = result.error.errors[0];
        expect(firstError).toBeDefined();
        // Verifica que há um erro relacionado ao campo desconhecido
        expect(firstError.code).toBe("unrecognized_keys");
      }
    });

    it("deve validar campos quando fornecidos", () => {
      const invalidData = {
        name: "AB", // Muito curto
      };

      const result = updateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("mínimo 3 caracteres");
      }
    });
  });

  describe("tenantBaseSchema", () => {
    it("deve validar schema base sem user", () => {
      const validData = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        planId: "123e4567-e89b-12d3-a456-426614174000",
        status: "ACTIVE" as const,
      };

      const result = tenantBaseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar status inválido", () => {
      const invalidData = {
        name: "Carioca Lanches",
        slug: "carioca-lanches",
        status: "INVALID_STATUS" as any,
      };

      const result = tenantBaseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        const firstError = result.error.errors[0];
        expect(firstError).toBeDefined();
        // Verifica que há um erro de enum inválido
        expect(firstError.code).toBe("invalid_enum_value");
        if (firstError.message) {
          expect(firstError.message).toContain("ACTIVE, INACTIVE ou PAST_DUE");
        }
      }
    });
  });
});
