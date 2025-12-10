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

app.get('/api/products', async (c) => {
  try {
    const products = await new PrismaClient().product.findMany();
    return c.json(products);
  } catch (error) {
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

const port = 3333;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname: '127.0.0.1',
});
