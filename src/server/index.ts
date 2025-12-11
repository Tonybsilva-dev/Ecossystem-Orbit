import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { auth } from '../features/auth/auth'; // Import your auth instance
import { cors } from 'hono/cors';
import { productsRouter } from './routes/products.routes';
import { barbershopRouter } from './routes/barbershop.routes';

const app = new Hono();

// Enable CORS if needed (though proxy handles same-origin)
app.use('/*', cors());

// Mount BetterAuth handler
app.all('/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

const routes = app
  .route('/api/products', productsRouter)
  .route('/api/barbershop', barbershopRouter);

export type AppType = typeof routes;

const port = Number(process.env.SERVER_PORT) || 3333;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname: '127.0.0.1',
});
