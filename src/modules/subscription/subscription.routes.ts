import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { requireOperator } from "../../plugins/auth.js";
import { prisma } from "../../shared/db.js";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import { SubscriptionService } from "./subscription.service.js";

export async function subscriptionRoutes(app: FastifyInstance) {
  // Público: self-service — novo tenant se cadastra num produto (ex: onboarding
  // do barber-flow). Cria Tenant + User (se não existir) + Subscription.
  app.post("/subscriptions", async (request, reply) => {
    const body = request.body as {
      tenantName?: string;
      email?: string;
      planId?: string;
      slug?: string;
      interval?: "MONTHLY" | "YEARLY";
    };

    if (!body.tenantName || !body.email || !body.planId) {
      throw new ValidationError("Missing required fields: tenantName, email, planId");
    }

    const plan = await prisma.plan.findUnique({ where: { id: body.planId }, include: { product: true } });
    if (!plan || !plan.isActive) throw new ValidationError("Invalid or inactive plan");

    const baseSlug = body.slug || body.tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const uniqueSlug = `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`;

    const tenant = await prisma.tenant.create({
      data: { name: body.tenantName, slug: uniqueSlug, status: "ACTIVE" },
    });

    let user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: body.email,
          name: body.tenantName.split(" ")[0] || "Admin",
          role: "ADMIN",
          passwordHash: "oauth-managed",
          tenantId: tenant.id,
        },
      });
    }

    const licenseKey = crypto.randomBytes(8).toString("hex").toUpperCase().match(/.{1,4}/g)?.join("-") || "KEY-ERROR";

    const now = new Date();
    const expiresAt = new Date(now);
    const effectiveInterval = body.interval === "YEARLY" || body.interval === "MONTHLY" ? body.interval : plan.interval;
    if (effectiveInterval === "MONTHLY") expiresAt.setMonth(expiresAt.getMonth() + 1);
    else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const subscription = await prisma.subscription.create({
      data: { tenantId: tenant.id, planId: plan.id, licenseKey, status: "ACTIVE", expiresAt },
    });

    return reply.send({
      success: true,
      licenseKey: subscription.licenseKey,
      plan: { name: plan.name, features: plan.features, limits: plan.limits },
    });
  });

  app.register(async (operatorApp) => {
    operatorApp.addHook("preHandler", requireOperator);

    operatorApp.get("/subscriptions", async (request) => {
      const query = request.query as { page?: string; limit?: string; search?: string; productId?: string; status?: string };
      return SubscriptionService.listSubscriptions({
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        search: query.search,
        productId: query.productId,
        status: query.status,
      });
    });

    operatorApp.get("/subscriptions/:id", async (request) => {
      const { id } = request.params as { id: string };
      const subscription = await SubscriptionService.getSubscriptionById(id);
      if (!subscription) throw new NotFoundError("Subscription not found");
      return subscription;
    });

    operatorApp.post("/subscriptions/:id/cancel", async (request) => {
      const { id } = request.params as { id: string };
      return SubscriptionService.cancelSubscription(id);
    });

    operatorApp.delete("/subscriptions/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      await SubscriptionService.deleteSubscription(id);
      return reply.status(204).send();
    });
  });
}
