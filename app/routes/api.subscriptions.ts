import crypto from "crypto";
import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/core/db/prisma.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { tenantName, email, planId, slug } = body;

    // 1. Basic Validation
    if (!tenantName || !email || !planId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Fetch Plan to verify and calculate end date
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true }
    });

    if (!plan || !plan.isActive) {
      return Response.json({ error: "Invalid or inactive plan" }, { status: 400 });
    }

    // 3. Create Tenant
    // Ensure unique slug by appending random chars
    const baseSlug = slug || tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const uniqueSlug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: uniqueSlug,
        status: "ACTIVE"
      }
    });

    // 4. Find or Create User linked to Tenant
    // Since User belongs to Tenant, we must create user with tenantId.
    // If user exists, we might need to handle multi-tenancy or error.
    // For simplicity in this flow, we assume single-tenant user or create new.
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: tenantName.split(' ')[0] || 'Admin',
          role: "ADMIN", // First user is Admin
          passwordHash: "oauth-managed", // Dummy hash for OAuth users
          tenantId: tenant.id
        }
      });
    }

    // 5. Generate License Key
    const licenseKey = crypto.randomBytes(8).toString("hex").toUpperCase().match(/.{1,4}/g)?.join("-") || "KEY-ERROR";

    // 6. Create Subscription
    const now = new Date();
    const expiresAt = new Date();
    if (plan.interval === "MONTHLY") expiresAt.setMonth(expiresAt.getMonth() + 1);
    else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        licenseKey,
        status: "ACTIVE",
        expiresAt: expiresAt
      }
    });

    return Response.json({
      success: true,
      licenseKey: subscription.licenseKey,
      plan: {
        name: plan.name,
        features: plan.features
      }
    });

  } catch (error) {
    console.error("Subscription Create Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
