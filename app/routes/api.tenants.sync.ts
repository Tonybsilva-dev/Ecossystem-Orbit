import type { ActionFunctionArgs } from "react-router";
import { prisma } from "../core/db/prisma.server";
import { TenantService } from "../core/domain/tenant/tenant.service";
import crypto from "node:crypto";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Verify API Secret (simple auth for server-to-server)
  const authHeader = request.headers.get("Authorization");
  const apiSecret = process.env.ORBIT_API_SECRET;

  if (!apiSecret || authHeader !== `Bearer ${apiSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { name, email, origin, externalId } = payload;

    if (!name || !email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Reuse or Create Tenant logic
    // We assume externalId matches the BarberFlow BarbershopID or UserID context
    // Ideally, we search by email first to avoid duplicates if the user already exists

    // 1. Check if user email already has a tenant (simplified: email-based tenant)
    // In a real scenario, we might want to allow 1 User -> N Tenants.
    // user.service would be better here, but let's stick to TenantService for now.

    // Check if tenant exists by slug (derived from name) or email relation
    // For now, let's create a new one if it doesn't exist, or return existing.

    let tenant = await prisma.tenant.findFirst({
      where: {
        users: { some: { email } }
      }
    });

    if (!tenant) {
      // Create new Tenant
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + crypto.randomBytes(2).toString('hex');

      tenant = await TenantService.create({
        name,
        slug,
        email, // Admin email
        // planId is optional now, we don't start with a plan on sync, usually
      });
    }

    // Ensure we have a license key if one doesn't exist? 
    // Actually, sync just registers the tenant. The subscription comes later via another event or manual add.

    return Response.json({
      success: true,
      tenantId: tenant.id,
      slug: tenant.slug
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
