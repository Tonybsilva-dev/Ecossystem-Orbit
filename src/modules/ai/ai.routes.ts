import type { FastifyInstance } from "fastify";
import { requireOperator } from "../../plugins/auth.js";
import { ValidationError } from "../../shared/errors.js";
import { AIClientError, getAiClient } from "./ai.client.js";

export async function aiRoutes(app: FastifyInstance) {
  app.register(async (operatorApp) => {
    operatorApp.addHook("preHandler", requireOperator);

    operatorApp.post("/ai/completion", async (request, reply) => {
      const body = request.body as { prompt?: string; context?: Record<string, unknown> };
      if (!body.prompt) throw new ValidationError("prompt é obrigatório");

      const client = getAiClient();
      if (!client) {
        return reply.status(503).send({ error: "AI providers not configured (OPENAI_API_KEY / GOOGLE_GEMINI_API_KEY)" });
      }

      try {
        const text = await client.completion(body.prompt, body.context);
        return reply.send({ text });
      } catch (error) {
        if (error instanceof AIClientError) {
          return reply.status(502).send({ error: error.message });
        }
        throw error;
      }
    });
  });
}
