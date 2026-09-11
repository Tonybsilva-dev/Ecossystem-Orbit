import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { requireOperator } from "../../plugins/auth.js";
import { prisma } from "../../shared/db.js";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import { TenantService } from "./tenant.service.js";
import { updateTenantSchema } from "./tenant.schema.js";

export async function tenantRoutes(app: FastifyInstance) {
  // Server-to-server: chamado pelo backend de cada tenant app no signup do
  // usuário (ex: barber-flow em databaseHooks.user.create). Protegido pelo
  // mesmo secret operador — só apps já provisionados o conhecem.
  app.post("/tenants/sync", { preHandler: requireOperator }, async (request, reply) => {
    const body = request.body as { name?: string; email?: string; externalId?: string };

    if (!body.name || !body.email) {
      throw new ValidationError("Missing required fields: name, email");
    }

    let tenant = await prisma.tenant.findFirst({
      where: { users: { some: { email: body.email } } },
    });

    if (!tenant) {
      const slug = `${body.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${crypto.randomBytes(2).toString("hex")}`;
      tenant = await prisma.tenant.create({
        data: {
          name: body.name,
          slug,
          users: {
            create: {
              email: body.email,
              name: body.name,
              passwordHash: "oauth-managed",
              role: "OWNER",
            },
          },
        },
      });
    }

    return reply.send({ success: true, tenantId: tenant.id, slug: tenant.slug });
  });

  app.register(async (operatorApp) => {
    operatorApp.addHook("preHandler", requireOperator);

    operatorApp.get("/tenants", async () => TenantService.list());

    operatorApp.get("/tenants/search", async (request) => {
      const { query } = request.query as { query?: string };
      return TenantService.searchTenants(query ?? "");
    });

    operatorApp.get("/tenants/:id", async (request) => {
      const { id } = request.params as { id: string };
      const tenant = await TenantService.findById(id);
      if (!tenant) throw new NotFoundError("Tenant not found");
      return tenant;
    });

    operatorApp.post("/tenants", async (request, reply) => {
      const tenant = await TenantService.create(request.body);
      return reply.status(201).send(tenant);
    });

    operatorApp.patch("/tenants/:id", async (request) => {
      const { id } = request.params as { id: string };
      const parsed = updateTenantSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0]?.message || "Dados inválidos");
      }
      return TenantService.update(id, parsed.data);
    });

    // Kill switch.
    operatorApp.post("/tenants/:id/status", async (request) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status?: string };
      if (status !== "ACTIVE" && status !== "INACTIVE" && status !== "PAST_DUE") {
        throw new ValidationError("status deve ser ACTIVE, INACTIVE ou PAST_DUE");
      }
      return TenantService.setStatus(id, status);
    });

    operatorApp.post("/tenants/:id/subscriptions", async (request, reply) => {
      const { id } = request.params as { id: string };
      const { planId } = request.body as { planId?: string };
      if (!planId) throw new ValidationError("planId é obrigatório");
      const subscription = await TenantService.addSubscription(id, planId);
      return reply.status(201).send(subscription);
    });
  });
}
