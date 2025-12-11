import { Hono } from 'hono';
import { prisma } from '../db';

export const productsRouter = new Hono().get('/', async (c) => {
  const getTenantId = (c: any) => c.req.header('X-Barbershop-ID');
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
});
