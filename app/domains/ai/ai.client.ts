/**
 * AI Client Gateway
 *
 * Base HTTP client for communicating with AI providers using Vercel AI SDK.
 * This module provides a resilient interface for making API calls to AI providers
 * with support for multiple providers, retry logic, and fallback mechanisms.
 *
 * @module ai.client
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

/**
 * Supported AI providers.
 */
export type AIProvider = "openai" | "google";

/**
 * Configuration for AI client requests.
 */
export interface AIClientRequestConfig {
  /**
   * The prompt to send to the AI provider.
   */
  prompt: string;
  /**
   * Additional context to include in the request.
   */
  context?: Record<string, unknown>;
  /**
   * The model to use for the completion (overrides default).
   */
  model?: string;
  /**
   * Maximum number of tokens in the response (overrides default).
   */
  maxTokens?: number;
  /**
   * Temperature for response randomness (0-2, overrides default).
   */
  temperature?: number;
}

/**
 * Configuration for the AI Client instance.
 */
export interface AIClientConfig {
  /**
   * Primary AI provider to use.
   */
  provider: AIProvider;
  /**
   * Model ID for the primary provider.
   */
  model: string;
  /**
   * Maximum number of retry attempts for failed requests.
   * @default 3
   */
  maxRetries?: number;
  /**
   * Optional fallback provider configuration.
   */
  fallback?: {
    provider: AIProvider;
    model: string;
  };
  /**
   * Default maximum tokens for completions.
   * @default 1000
   */
  defaultMaxTokens?: number;
  /**
   * Default temperature for completions.
   * @default 0.7
   */
  defaultTemperature?: number;
}

/**
 * Error thrown when the AI API request fails.
 */
export class AIClientError extends Error {
  public readonly provider?: AIProvider;
  public readonly attempt?: number;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    provider?: AIProvider,
    attempt?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = "AIClientError";
    this.provider = provider;
    this.attempt = attempt;
    this.originalError = originalError;
  }
}

/**
 * AI Client Gateway
 *
 * Provides a resilient HTTP client for communicating with AI providers.
 * Supports multiple providers (OpenAI, Google Gemini) with retry logic
 * and automatic fallback mechanisms.
 */
export class AIClient {
  private readonly config: Required<Pick<AIClientConfig, "maxRetries" | "defaultMaxTokens" | "defaultTemperature">> &
    AIClientConfig;

  /**
   * Creates a new AI Client instance.
   *
   * @param config - Client configuration
   * @throws {Error} If required API keys are not set in environment variables
   *
   * @example
   * ```ts
   * const client = new AIClient({
   *   provider: "openai",
   *   model: "gpt-4o",
   *   fallback: {
   *     provider: "google",
   *     model: "gemini-1.5-flash"
   *   }
   * });
   * ```
   */
  constructor(config: AIClientConfig) {
    // Validate API keys based on provider
    if (config.provider === "openai" && !process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is required for OpenAI provider. Set it in your environment variables."
      );
    }
    if (config.provider === "google" && !process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error(
        "GOOGLE_GEMINI_API_KEY is required for Google provider. Set it in your environment variables."
      );
    }
    if (config.fallback?.provider === "openai" && !process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is required for OpenAI fallback provider. Set it in your environment variables."
      );
    }
    if (config.fallback?.provider === "google" && !process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error(
        "GOOGLE_GEMINI_API_KEY is required for Google fallback provider. Set it in your environment variables."
      );
    }

    this.config = {
      maxRetries: 3,
      defaultMaxTokens: 1000,
      defaultTemperature: 0.7,
      ...config,
    };
  }

  /**
   * Gets the model instance for the specified provider.
   *
   * @param provider - The AI provider
   * @param modelId - The model ID
   * @returns The model instance
   * @throws {Error} If the provider is not supported
   */
  private getModel(provider: AIProvider, modelId: string) {
    if (provider === "openai") {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai(modelId);
    }
    if (provider === "google") {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GEMINI_API_KEY,
      });
      return google(modelId);
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Builds a system message from context.
   *
   * @param context - Optional context object
   * @returns System message string
   */
  private buildSystemMessage(context?: Record<string, unknown>): string {
    if (!context || Object.keys(context).length === 0) {
      return "You are a helpful assistant.";
    }

    const contextString = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join("\n");

    return `You are a helpful assistant with the following context:\n${contextString}`;
  }

  /**
   * Sends a completion request to the AI provider.
   *
   * @param prompt - The prompt to send to the AI
   * @param context - Optional context object to include in the request
   * @returns A promise that resolves to the completion text
   * @throws {AIClientError} If all attempts fail
   *
   * @example
   * ```ts
   * const client = new AIClient({
   *   provider: "openai",
   *   model: "gpt-4o"
   * });
   * const response = await client.completion("Hello, world!", {
   *   userId: "user-123",
   *   sessionId: "session-456"
   * });
   * console.log(response); // "Hello! How can I help you today?"
   * ```
   */
  async completion(
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<string> {
    return this.completionWithConfig({
      prompt,
      context,
    });
  }

  /**
   * Sends a completion request with full configuration options.
   *
   * @param config - Complete request configuration
   * @returns A promise that resolves to the completion text
   * @throws {AIClientError} If all attempts fail
   */
  async completionWithConfig(config: AIClientRequestConfig): Promise<string> {
    const maxRetries = this.config.maxRetries;
    let attempts = 0;
    let lastError: unknown;

    // Try primary provider with retries
    while (attempts < maxRetries) {
      try {
        const model = this.getModel(
          this.config.provider,
          config.model || this.config.model
        );

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

        // If this is the last attempt, break to try fallback
        if (attempts >= maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = 1000 * Math.pow(2, attempts - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Try fallback if configured
    if (this.config.fallback) {
      try {
        const model = this.getModel(
          this.config.fallback.provider,
          this.config.fallback.model
        );

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
        // If fallback also fails, throw error with both failures
        throw new AIClientError(
          `All AI providers failed. Primary provider (${this.config.provider}) failed after ${maxRetries} attempts, and fallback provider (${this.config.fallback.provider}) also failed.`,
          this.config.fallback.provider,
          undefined,
          error
        );
      }
    }

    // No fallback configured, throw error with primary provider failure
    throw new AIClientError(
      `AI provider (${this.config.provider}) failed after ${maxRetries} attempts.`,
      this.config.provider,
      maxRetries,
      lastError
    );
  }
}

/**
 * Default AI client instance configured with OpenAI as primary
 * and Google Gemini as fallback.
 *
 * Lazy initialization to avoid issues during module loading in test environments.
 *
 * @example
 * ```ts
 * import { aiClient } from "~/domains/ai/ai.client";
 * const response = await aiClient.completion("Hello!");
 * ```
 */
let _aiClientInstance: AIClient | null = null;

export const aiClient = (() => {
  if (_aiClientInstance) {
    return _aiClientInstance;
  }

  // Only initialize if API keys are available
  // This prevents module loading errors in test environments
  if (process.env.OPENAI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY) {
    try {
      _aiClientInstance = new AIClient({
        provider: "openai",
        model: "gpt-4o",
        fallback: {
          provider: "google",
          model: "gemini-1.5-flash",
        },
      });
      return _aiClientInstance;
    } catch (error) {
      // In test environments, return a mock-like object
      if (process.env.NODE_ENV === "test") {
        return {} as AIClient;
      }
      throw error;
    }
  }

  // Return a mock-like object in test environments when keys are not set
  return {} as AIClient;
})();
