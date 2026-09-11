import type { FastifyInstance } from "fastify";
import { validateAccess } from "./license.engine.js";

const LICENSE_VALIDATION_CACHE_CONTROL = "public, max-age=600, stale-while-revalidate=3600";

export async function licenseRoutes(app: FastifyInstance) {
  app.get("/validate", async (request, reply) => {
    const { licenseKey } = request.query as { licenseKey?: string };
    const origin = request.headers.origin;

    if (!licenseKey) {
      return reply.status(400).send({ error: "Missing licenseKey query parameter" });
    }
    if (!origin) {
      return reply.status(400).send({ error: "Missing Origin header" });
    }

    try {
      const result = await validateAccess({ licenseKey, origin });

      if (result.valid) {
        return reply
          .header("Cache-Control", LICENSE_VALIDATION_CACHE_CONTROL)
          .status(200)
          .send({ valid: true, capabilities: result.capabilities, limits: result.limits });
      }

      return reply.status(403).send({ valid: false, capabilities: [] });
    } catch (error) {
      request.log.error(error, "Error validating license");
      return reply.status(500).send({ error: "Internal server error", valid: false, capabilities: [] });
    }
  });
}
