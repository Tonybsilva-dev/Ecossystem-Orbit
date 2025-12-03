/**
 * Unit Tests for AI Client Gateway
 *
 * Tests for the AI client using Vercel AI SDK with mocks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted to ensure mocks are created before module evaluation
const { mockCreateOpenAI, mockCreateGoogleGenerativeAI, mockGenerateText } = vi.hoisted(() => {
  const mockCreateOpenAI = vi.fn(() => (modelId: string) => ({
    provider: "openai",
    modelId,
  }));

  const mockCreateGoogleGenerativeAI = vi.fn(() => (modelId: string) => ({
    provider: "google",
    modelId,
  }));

  const mockGenerateText = vi.fn();

  return { mockCreateOpenAI, mockCreateGoogleGenerativeAI, mockGenerateText };
});

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: mockCreateOpenAI,
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: mockCreateGoogleGenerativeAI,
}));

vi.mock("ai", () => ({
  generateText: mockGenerateText,
}));

// Import module after mocks
import { AIClient, AIClientError } from "./ai.client";

describe("AIClient", () => {
  const mockApiKey = "test-api-key-12345";
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: mockApiKey,
      GOOGLE_GEMINI_API_KEY: mockApiKey,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("deve criar uma instância com configuração válida", () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
      });
      expect(client).toBeInstanceOf(AIClient);
    });

    it("deve criar uma instância com fallback configurado", () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        fallback: {
          provider: "google",
          model: "gemini-1.5-flash",
        },
      });
      expect(client).toBeInstanceOf(AIClient);
    });

    it("deve lançar erro se OPENAI_API_KEY não estiver definida para provider OpenAI", () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => {
        new AIClient({
          provider: "openai",
          model: "gpt-4o",
        });
      }).toThrow("OPENAI_API_KEY is required");
    });

    it("deve lançar erro se GOOGLE_GEMINI_API_KEY não estiver definida para provider Google", () => {
      delete process.env.GOOGLE_GEMINI_API_KEY;

      expect(() => {
        new AIClient({
          provider: "google",
          model: "gemini-1.5-flash",
        });
      }).toThrow("GOOGLE_GEMINI_API_KEY is required");
    });

    it("deve lançar erro se OPENAI_API_KEY não estiver definida para fallback OpenAI", () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => {
        new AIClient({
          provider: "google",
          model: "gemini-1.5-flash",
          fallback: {
            provider: "openai",
            model: "gpt-4o",
          },
        });
      }).toThrow("OPENAI_API_KEY is required");
    });

    it("deve usar valores padrão para maxRetries, defaultMaxTokens e defaultTemperature", () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
      });
      expect(client).toBeInstanceOf(AIClient);
      // Access private config via type assertion for testing
      const config = (client as unknown as { config: { maxRetries: number; defaultMaxTokens: number; defaultTemperature: number } }).config;
      expect(config.maxRetries).toBe(3);
      expect(config.defaultMaxTokens).toBe(1000);
      expect(config.defaultTemperature).toBe(0.7);
    });

    it("deve aceitar configurações customizadas", () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        maxRetries: 5,
        defaultMaxTokens: 2000,
        defaultTemperature: 0.5,
      });
      expect(client).toBeInstanceOf(AIClient);
      // Access private config via type assertion for testing
      const config = (client as unknown as { config: { maxRetries: number; defaultMaxTokens: number; defaultTemperature: number } }).config;
      expect(config.maxRetries).toBe(5);
      expect(config.defaultMaxTokens).toBe(2000);
      expect(config.defaultTemperature).toBe(0.5);
    });
  });

  describe("completion", () => {
    it("deve retornar texto quando a requisição é bem-sucedida", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
      });

      const expectedText = "This is the AI response";
      mockGenerateText.mockResolvedValue({
        text: expectedText,
      });

      const result = await client.completion("Test prompt");

      expect(result).toBe(expectedText);
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({ provider: "openai", modelId: "gpt-4o" }),
          prompt: "Test prompt",
          system: "You are a helpful assistant.",
          maxOutputTokens: 1000,
          temperature: 0.7,
        })
      );
    });

    it("deve incluir context no system message quando fornecido", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
      });

      mockGenerateText.mockResolvedValue({
        text: "Response with context",
      });

      await client.completion("Test prompt", {
        userId: "user-123",
        sessionId: "session-456",
      });

      expect(mockGenerateText).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateText.mock.calls[0][0];
      expect(callArgs.system).toContain("userId");
      expect(callArgs.system).toContain("user-123");
      expect(callArgs.system).toContain("sessionId");
      expect(callArgs.system).toContain("session-456");
    });

    it("deve usar valores padrão para maxOutputTokens e temperature", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
      });

      mockGenerateText.mockResolvedValue({
        text: "Response",
      });

      await client.completion("Test prompt");

      const callArgs = mockGenerateText.mock.calls[0][0];
      expect(callArgs.maxOutputTokens).toBe(1000);
      expect(callArgs.temperature).toBe(0.7);
    });

    it("deve tentar novamente em caso de falha (retry)", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        maxRetries: 3,
      });

      // Fail twice, then succeed
      mockGenerateText
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          text: "Success after retries",
        });

      // Mock setTimeout to speed up tests
      vi.useFakeTimers();
      const resultPromise = client.completion("Test prompt");

      // Fast-forward through delays
      await vi.advanceTimersByTimeAsync(10000);

      const result = await resultPromise;

      expect(result).toBe("Success after retries");
      expect(mockGenerateText).toHaveBeenCalledTimes(3);
      vi.useRealTimers();
    });

    it("deve usar fallback quando primary provider falha após todas as tentativas", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        maxRetries: 2,
        fallback: {
          provider: "google",
          model: "gemini-1.5-flash",
        },
      });

      // Primary provider fails
      mockGenerateText.mockRejectedValue(new Error("OpenAI error"));

      // Fallback succeeds
      mockGenerateText.mockResolvedValueOnce({
        text: "Fallback response",
      });

      // Mock setTimeout
      vi.useFakeTimers();
      const resultPromise = client.completion("Test prompt");

      // Fast-forward through delays
      await vi.advanceTimersByTimeAsync(10000);

      const result = await resultPromise;

      expect(result).toBe("Fallback response");
      // Should have tried primary 2 times + fallback 1 time
      expect(mockGenerateText).toHaveBeenCalledTimes(3);
      vi.useRealTimers();
    });

    it("deve lançar AIClientError quando todos os providers falham", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        maxRetries: 2,
        fallback: {
          provider: "google",
          model: "gemini-1.5-flash",
        },
      });

      // Both providers fail
      mockGenerateText.mockRejectedValue(new Error("Provider error"));

      // Mock setTimeout
      vi.useFakeTimers();
      const resultPromise = client.completion("Test prompt");

      // Fast-forward through delays
      await vi.advanceTimersByTimeAsync(10000);

      await expect(resultPromise).rejects.toThrow(AIClientError);

      try {
        await resultPromise;
      } catch (error) {
        expect(error).toBeInstanceOf(AIClientError);
        if (error instanceof AIClientError) {
          expect(error.message).toContain("All AI providers failed");
          expect(error.provider).toBe("google");
        }
      }
      vi.useRealTimers();
    });

    it("deve lançar AIClientError quando provider falha sem fallback", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        maxRetries: 2,
      });

      mockGenerateText.mockRejectedValue(new Error("Provider error"));

      // Mock setTimeout
      vi.useFakeTimers();
      const resultPromise = client.completion("Test prompt");

      // Fast-forward through delays
      await vi.advanceTimersByTimeAsync(10000);

      await expect(resultPromise).rejects.toThrow(AIClientError);

      try {
        await resultPromise;
      } catch (error) {
        expect(error).toBeInstanceOf(AIClientError);
        if (error instanceof AIClientError) {
          expect(error.message).toContain("failed after 2 attempts");
          expect(error.provider).toBe("openai");
          expect(error.attempt).toBe(2);
        }
      }
      vi.useRealTimers();
    });
  });

  describe("completionWithConfig", () => {
    it("deve aceitar configuração customizada", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        defaultMaxTokens: 1000,
        defaultTemperature: 0.7,
      });

      mockGenerateText.mockResolvedValue({
        text: "Custom response",
      });

      await client.completionWithConfig({
        prompt: "Custom prompt",
        model: "gpt-3.5-turbo",
        maxTokens: 500,
        temperature: 0.5,
        context: { custom: "value" },
      });

      const callArgs = mockGenerateText.mock.calls[0][0];
      expect(callArgs.maxOutputTokens).toBe(500); // Internally uses maxOutputTokens
      expect(callArgs.temperature).toBe(0.5);
      expect(callArgs.system).toContain("custom");
      expect(callArgs.system).toContain("value");
    });

    it("deve usar valores padrão quando não especificados na config", async () => {
      const client = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        defaultMaxTokens: 2000,
        defaultTemperature: 0.9,
      });

      mockGenerateText.mockResolvedValue({
        text: "Response",
      });

      await client.completionWithConfig({
        prompt: "Test prompt",
      });

      const callArgs = mockGenerateText.mock.calls[0][0];
      expect(callArgs.maxOutputTokens).toBe(2000);
      expect(callArgs.temperature).toBe(0.9);
    });
  });

  describe("AIClientError", () => {
    it("deve criar erro com todas as propriedades", () => {
      const originalError = new Error("Original error");
      const error = new AIClientError(
        "Test error",
        "openai",
        2,
        originalError
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AIClientError);
      expect(error.message).toBe("Test error");
      expect(error.provider).toBe("openai");
      expect(error.attempt).toBe(2);
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe("AIClientError");
    });
  });
});
