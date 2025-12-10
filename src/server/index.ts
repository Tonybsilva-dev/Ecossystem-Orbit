import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { auth } from '../features/auth/auth'; // Import your auth instance
import { cors } from 'hono/cors';
import { PrismaClient } from '@prisma/client';

const app = new Hono();

// Enable CORS if needed (though proxy handles same-origin)
app.use('/*', cors());

// Mount BetterAuth handler
app.all('/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

const prisma = new PrismaClient();

// Middleware to extract tenant ID
const getTenantId = (c: any) => {
  const customHeader = c.req.header('X-Barbershop-ID');
  // In a real app, this might also come from subdomain or auth token
  return customHeader;
};

const routes = app
  .get('/api/products', async (c) => {
    const barbershopId = getTenantId(c);
    const city = c.req.query('city');
    const state = c.req.query('state');

    try {
      if (barbershopId) {
        // Specific Tenant (Single Shop View)
        const products = await prisma.product.findMany({
          where: { barbershopId },
        });
        return c.json(products);
      }

      if (city && state) {
        // Marketplace View (Filtered by Location)
        // 1. Find Barbershops in this location
        const shops = await prisma.barbershop.findMany({
          where: {
            city: { equals: city, mode: 'insensitive' }, // Case insensitive for better UX
            state: { equals: state, mode: 'insensitive' },
          },
          select: { id: true },
        });

        const shopIds = shops.map((s) => s.id);

        if (shopIds.length === 0) {
          return c.json([]);
        }

        // 2. Find Products from these shops
        const products = await prisma.product.findMany({
          where: { barbershopId: { in: shopIds } },
          include: {
            barbershop: { select: { name: true, city: true } }, // Include shop info for display
          },
        });
        return c.json(products);
      }

      return c.json({ error: 'Tenant ID or Location (City/State) required' }, 400);
    } catch {
      return c.json({ error: 'Failed to fetch products' }, 500);
    }
  })
  .get('/api/barbershop', async (c) => {
    // This endpoint can be used to "resolve" a tenant or check onboarding
    // For now, if no tenant is passed, we check if ANY exists (for singleton onboarding check)
    // If tenant is passed, we return that specific one.

    const tenantId = getTenantId(c);

    try {
      if (tenantId) {
        const shop = await prisma.barbershop.findUnique({ where: { id: tenantId } });
        return c.json(shop || null);
      }

      // Fallback for onboarding check (singleton behavior for now)
      // In strict SaaS, we wouldn't do this, but for the "Onboarding" flow transition:
      const shop = await prisma.barbershop.findFirst();
      return c.json(shop || null);
    } catch (error) {
      return c.json({ error: 'Failed to fetch barbershop config' }, 500);
    }
  })
  .post('/api/barbershop', async (c) => {
    try {
      const body = await c.req.json();
      const existing = await prisma.barbershop.findFirst();

      // For this simplified onboarding, we only allow ONE shop creation or update the existing one.
      // In a real SaaS, this would be a "Create Tenant" endpoint.

      const isTrial = body.licenseKey === 'TRIAL-VERSION';
      const licenseStatus = isTrial ? 'TRIAL' : body.licenseKey ? 'ACTIVE' : 'PENDING';
      const planType = isTrial ? 'FREE' : body.planType || 'BASIC';

      if (existing) {
        const updated = await prisma.barbershop.update({
          where: { id: existing.id },
          data: {
            ...body,
            licenseStatus,
            planType,
          },
        });
        return c.json(updated);
      } else {
        const created = await prisma.barbershop.create({
          data: {
            ...body,
            licenseStatus,
            planType,
          },
        });
        return c.json(created);
      }
    } catch (error) {
      console.error(error);
      return c.json({ error: 'Failed to save barbershop config' }, 500);
    }
  });

export type AppType = typeof routes;

const port = 3333;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname: '127.0.0.1',
});
