import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./shared/env.js";
import { AppError } from "./shared/errors.js";
import { tenantRoutes } from "./modules/tenant/tenant.routes.js";
import { productRoutes } from "./modules/product/product.routes.js";
import { subscriptionRoutes } from "./modules/subscription/subscription.routes.js";
import { licenseRoutes } from "./modules/license/license.routes.js";
import { aiRoutes } from "./modules/ai/ai.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";

const app = Fastify({ logger: true });

await app.register(helmet);
await app.register(cors, { origin: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] });
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

app.get("/", async () => ({ service: "api-orbit", status: "ok" }));

await app.register(licenseRoutes);
await app.register(productRoutes);
await app.register(subscriptionRoutes);
await app.register(tenantRoutes);
await app.register(aiRoutes);
await app.register(authRoutes);

app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }

  if (error.validation) {
    return reply.status(400).send({ error: error.message });
  }

  request.log.error(error);
  return reply.status(500).send({ error: "Internal server error" });
});

app
  .listen({ port: env.PORT, host: env.HOST })
  .then(() => app.log.info(`api-orbit listening on ${env.HOST}:${env.PORT}`))
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
