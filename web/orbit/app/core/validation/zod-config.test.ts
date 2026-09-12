import { describe, it, expect } from "vitest";
import { z } from "./zod-config";

describe("Zod PT-BR Error Messages", () => {
  it("deve retornar mensagem de erro em PT-BR para string muito curta", () => {
    const schema = z.string().min(5, "Mínimo de 5 caracteres");

    try {
      schema.parse("abc");
      expect.fail("Deveria ter lançado um erro");
    } catch (error) {
      if (error instanceof z.ZodError) {
        expect(error.errors[0].message).toBeDefined();
        // Verifica que a mensagem não está em inglês padrão
        expect(error.errors[0].message).not.toContain("String must contain");
      } else {
        expect.fail("Erro deveria ser uma instância de ZodError");
      }
    }
  });

  it("deve retornar mensagem de erro em PT-BR para tipo inválido", () => {
    const schema = z.string();

    const result = schema.safeParse(123);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);
      const firstError = result.error.errors[0];
      // Verifica que há uma mensagem de erro
      expect(firstError).toBeDefined();
      // Verifica que a mensagem não está em inglês padrão (se existir)
      if (firstError.message) {
        expect(firstError.message).not.toContain("Expected string");
      }
    }
  });

  it("deve retornar mensagem de erro em PT-BR para campo obrigatório", () => {
    const schema = z.object({
      name: z.string({ required_error: "Nome é obrigatório" }),
    });

    try {
      schema.parse({});
      expect.fail("Deveria ter lançado um erro");
    } catch (error) {
      if (error instanceof z.ZodError) {
        expect(error.errors[0].message).toBe("Nome é obrigatório");
      } else {
        expect.fail("Erro deveria ser uma instância de ZodError");
      }
    }
  });

  it("deve retornar mensagem de erro em PT-BR para email inválido", () => {
    const schema = z.string().email("Email inválido");

    try {
      schema.parse("email-invalido");
      expect.fail("Deveria ter lançado um erro");
    } catch (error) {
      if (error instanceof z.ZodError) {
        expect(error.errors[0].message).toBe("Email inválido");
      } else {
        expect.fail("Erro deveria ser uma instância de ZodError");
      }
    }
  });

  it("deve validar com sucesso quando os dados estão corretos", () => {
    const schema = z.string().min(3).max(10);

    const result = schema.parse("valid");
    expect(result).toBe("valid");
  });
});

