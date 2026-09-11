import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../shared/env.js";
import { UnauthorizedError } from "../shared/errors.js";

/**
 * Gate for the platform-operator-only surface (tenants, plans, subscriptions
 * management, kill switch). Orbit has a single operator — the shared secret
 * is the trust boundary between this API and the admin backend that calls it.
 */
export async function requireOperator(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  const expected = `Bearer ${env.ORBIT_API_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    throw new UnauthorizedError("Missing or invalid operator credentials");
  }
}
