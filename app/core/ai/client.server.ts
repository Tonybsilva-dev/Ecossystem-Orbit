import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

interface AIClientConfig {
  provider: "openai" | "google";
  model: string;
  maxRetries?: number;
}

export class AIClient {
  private config: AIClientConfig;

  constructor(config: AIClientConfig) {
    this.config = {
      maxRetries: 3,
      ...config,
    };
  }

  async completion(prompt: string): Promise<string | null> {
    let attempts = 0;
    while (attempts < (this.config.maxRetries || 3)) {
      try {
        const openai = createOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const { text } = await generateText({
          model: openai(this.config.model),
          prompt: prompt,
        });

        return text;
      } catch (error) {
        attempts++;
        console.error(`AI Client Error (Attempt ${attempts}):`, error);
        if (attempts >= (this.config.maxRetries || 3)) {
          // Fallback logic could go here (e.g., switch provider)
          console.error("Max retries reached. Failing.");
          return null;
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
      }
    }
    return null;
  }
}

export const aiClient = new AIClient({
  provider: "openai",
  model: "gpt-4o",
});
