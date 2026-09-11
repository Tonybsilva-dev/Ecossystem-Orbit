import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { sanitizeLogObject } from "./ai.utils.js";

export type AIProvider = "openai" | "google";

export interface AIClientRequestConfig {
  prompt: string;
  context?: Record<string, unknown>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIClientConfig {
  provider: AIProvider;
  model: string;
  maxRetries?: number;
  fallback?: { provider: AIProvider; model: string };
  defaultMaxTokens?: number;
  defaultTemperature?: number;
}

export class AIClientError extends Error {
  public readonly provider?: AIProvider;
  public readonly attempt?: number;
  public readonly originalError?: unknown;

  constructor(message: string, provider?: AIProvider, attempt?: number, originalError?: unknown) {
    super(message);
    this.name = "AIClientError";
    this.provider = provider;
    this.attempt = attempt;
    this.originalError = originalError;
  }
}

export class AIClient {
  private readonly config: Required<Pick<AIClientConfig, "maxRetries" | "defaultMaxTokens" | "defaultTemperature">> &
    AIClientConfig;

  constructor(config: AIClientConfig) {
    if (config.provider === "openai" && !process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for OpenAI provider.");
    }
    if (config.provider === "google" && !process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is required for Google provider.");
    }
    if (config.fallback?.provider === "openai" && !process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for OpenAI fallback provider.");
    }
    if (config.fallback?.provider === "google" && !process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is required for Google fallback provider.");
    }

    this.config = { maxRetries: 3, defaultMaxTokens: 1000, defaultTemperature: 0.7, ...config };
  }

  private getModel(provider: AIProvider, modelId: string) {
    if (provider === "openai") {
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(modelId);
    }
    if (provider === "google") {
      return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY })(modelId);
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  private buildSystemMessage(context?: Record<string, unknown>): string {
    if (!context || Object.keys(context).length === 0) return "You are a helpful assistant.";
    const contextString = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join("\n");
    return `You are a helpful assistant with the following context:\n${contextString}`;
  }

  async completion(prompt: string, context?: Record<string, unknown>): Promise<string> {
    return this.completionWithConfig({ prompt, context });
  }

  async completionWithConfig(config: AIClientRequestConfig): Promise<string> {
    const maxRetries = this.config.maxRetries;
    let attempts = 0;
    let lastError: unknown;

    while (attempts < maxRetries) {
      try {
        const model = this.getModel(this.config.provider, config.model || this.config.model);
        const systemMessage = this.buildSystemMessage(config.context);

        const { text } = await generateText({
          model,
          prompt: config.prompt,
          system: systemMessage,
          maxOutputTokens: config.maxTokens || this.config.defaultMaxTokens,
          temperature: config.temperature || this.config.defaultTemperature,
        });

        return text;
      } catch (error) {
        attempts++;
        lastError = error;

        if (attempts < maxRetries) {
          console.error(
            `[AIClient] Provider ${this.config.provider} attempt ${attempts} failed, retrying...`,
            sanitizeLogObject({ provider: this.config.provider, attempt: attempts, error }),
          );
        }
        if (attempts >= maxRetries) break;

        const delay = 1000 * Math.pow(2, attempts - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (this.config.fallback) {
      try {
        const model = this.getModel(this.config.fallback.provider, this.config.fallback.model);
        const systemMessage = this.buildSystemMessage(config.context);

        const { text } = await generateText({
          model,
          prompt: config.prompt,
          system: systemMessage,
          maxOutputTokens: config.maxTokens || this.config.defaultMaxTokens,
          temperature: config.temperature || this.config.defaultTemperature,
        });

        return text;
      } catch (error) {
        console.error(
          `[AIClient] Fallback provider ${this.config.fallback.provider} also failed`,
          sanitizeLogObject({
            primaryProvider: this.config.provider,
            fallbackProvider: this.config.fallback.provider,
            primaryAttempts: maxRetries,
            fallbackError: error,
          }),
        );

        throw new AIClientError(
          `All AI providers failed. Primary provider (${this.config.provider}) failed after ${maxRetries} attempts, and fallback provider (${this.config.fallback.provider}) also failed.`,
          this.config.fallback.provider,
          undefined,
          error,
        );
      }
    }

    console.error(
      `[AIClient] All attempts failed for provider ${this.config.provider}`,
      sanitizeLogObject({ provider: this.config.provider, attempts: maxRetries, error: lastError }),
    );

    throw new AIClientError(
      `AI provider (${this.config.provider}) failed after ${maxRetries} attempts.`,
      this.config.provider,
      maxRetries,
      lastError,
    );
  }
}

let _aiClientInstance: AIClient | null = null;

export function getAiClient(): AIClient | null {
  if (_aiClientInstance) return _aiClientInstance;

  if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
    return null;
  }

  _aiClientInstance = new AIClient({
    provider: "openai",
    model: "gpt-4o",
    fallback: { provider: "google", model: "gemini-1.5-flash" },
  });
  return _aiClientInstance;
}
