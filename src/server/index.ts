import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
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

if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
}

const port = Number(process.env.SERVER_PORT) || 3333;
const hostname = process.env.HOST || '0.0.0.0';
console.log(`Server is running on ${hostname}:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname,
});
