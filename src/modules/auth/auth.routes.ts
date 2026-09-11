import type { FastifyInstance } from "fastify";
import { requireOperator } from "../../plugins/auth.js";
import { prisma } from "../../shared/db.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors.js";
import { verifyPassword } from "./password.js";

/**
 * Autentica o operador da plataforma (o único admin do Orbit). O usuário
 * operador é uma linha em `User` como qualquer outra — não há tabela
 * separada de admins; a distinção é operacional (é o dono do produto).
 */
export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body.email || !body.password) {
      throw new ValidationError("email e password são obrigatórios");
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return reply.send({ userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId });
  });

  // Usado por requireAdmin no backend do web/orbit pra checar role da sessão.
  app.get("/auth/users/:id", { preHandler: requireOperator }, async (request) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, tenantId: true },
    });
    if (!user) throw new NotFoundError("User not found");
    return user;
  });
}
