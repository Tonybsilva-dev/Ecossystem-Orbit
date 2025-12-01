import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

interface AIClientConfig {
  provider: "openai" | "google";
  model: string;
  maxRetries?: number;
  fallback?: {
    provider: "openai" | "google";
    model: string;
  };
}

export class AIClient {
  private config: AIClientConfig;

  constructor(config: AIClientConfig) {
    this.config = {
      maxRetries: 3,
      ...config,
    };
  }

  private getModel(provider: "openai" | "google", modelId: string) {
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

  async completion(prompt: string): Promise<string | null> {
    let attempts = 0;
    const maxRetries = this.config.maxRetries || 3;

    // Try primary provider
    while (attempts < maxRetries) {
      try {
        const model = this.getModel(this.config.provider, this.config.model);
        const { text } = await generateText({
          model,
          prompt,
        });
        return text;
      } catch (error) {
        attempts++;
        console.error(`AI Client Error (Primary - Attempt ${attempts}):`, error);

        if (attempts >= maxRetries) {
          break; // Exit loop to try fallback
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
      }
    }

    // Try fallback if configured
    if (this.config.fallback) {
      console.log("Switching to fallback provider...");
      try {
        const model = this.getModel(this.config.fallback.provider, this.config.fallback.model);
        const { text } = await generateText({
          model,
          prompt,
        });
        return text;
      } catch (error) {
        console.error("AI Client Error (Fallback):", error);
      }
    }

    console.error("All attempts failed.");
    return null;
  }
}

export const aiClient = new AIClient({
  provider: "openai",
  model: "gpt-4o",
  fallback: {
    provider: "google",
    model: "gemini-1.5-flash",
  },
});
