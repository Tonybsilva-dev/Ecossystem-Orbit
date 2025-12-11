import { Hono } from 'hono';
import { prisma } from '../db';
import { generateSlug } from '../../shared/utils/string.utils';
import { auth } from '../../features/auth/auth';

export const barbershopRouter = new Hono()
  .get('/', async (c) => {
    // Middleware-like behavior for Tenant ID in a real app,
    // but here we grab it from context headers if provided or just check logic.
    const getTenantId = (c: any) => c.req.header('X-Barbershop-ID');
    const tenantId = getTenantId(c);

    try {
      if (tenantId) {
        const shop = await prisma.barbershop.findUnique({ where: { id: tenantId } });
        return c.json(shop || null);
      }

      // Fallback for onboarding check (singleton behavior for now)
      const shop = await prisma.barbershop.findFirst();
      return c.json(shop || null);
    } catch (error) {
      return c.json({ error: 'Failed to fetch barbershop config' }, 500);
    }
  })
  .post('/', async (c) => {
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const existing = await prisma.barbershop.findFirst();

      // For this simplified onboarding, we only allow ONE shop creation or update the existing one.
      const isTrial = body.licenseKey === 'TRIAL-VERSION';

      let licenseStatus = isTrial ? 'TRIAL' : 'PENDING';
      const planType = isTrial ? 'FREE' : 'BASIC';
      let modules: string[] = [];

      // Validate License with Orbit if not trial
      if (!isTrial && body.licenseKey) {
        try {
          const orbitUrl = process.env.ORBIT_API_URL || 'http://localhost:5173';

          const response = await fetch(`${orbitUrl}/api/validate?licenseKey=${body.licenseKey}`, {
            headers: {
              Origin: 'http://localhost:3333', // BarberFlow Backend Origin
            },
          });

          if (response.ok) {
            const data = (await response.json()) as { valid: boolean; capabilities: string[] };
            if (data.valid) {
              licenseStatus = 'ACTIVE';
              modules = data.capabilities;
            } else {
              return c.json({ error: 'Licença inválida ou inativa.' }, 400); // Using 400 as per previous logic
            }
          } else {
            return c.json({ error: 'Erro ao validar licença no servidor central.' }, 400);
          }
        } catch (err) {
          console.error('Orbit Validation Error:', err);
          return c.json({ error: 'Falha na comunicação com servidor de licenças.' }, 500);
        }
      } else if (!isTrial) {
        return c.json({ error: 'Chave de licença obrigatória.' }, 400);
      }

      // Type safety fix included
      const licenseStatusEnum = licenseStatus as 'TRIAL' | 'PENDING' | 'ACTIVE' | 'EXPIRED';
      const planTypeEnum = planType as 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'TRIAL';

      let shop;
      if (existing) {
        let slug = existing.slug;
        if (!slug && body.name) {
          slug = generateSlug(body.name);
        }

        shop = await prisma.barbershop.update({
          where: { id: existing.id },
          data: {
            ...body,
            slug,
            licenseStatus: licenseStatusEnum,
            planType: planTypeEnum,
            modules,
          },
        });
      } else {
        const slug = generateSlug(body.name);

        shop = await prisma.barbershop.create({
          data: {
            ...body,
            slug,
            licenseStatus: licenseStatusEnum,
            planType: planTypeEnum,
            modules,
          },
        });
      }

      // CRITICAL: Link User to Shop and Make Admin
      if (session.user) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            barbershopId: shop.id,
            role: 'ADMIN', // Promoting creator to Admin
          },
        });
      }

      return c.json(shop);
    } catch (error) {
      console.error(error);
      return c.json({ error: 'Failed to save barbershop config' }, 500);
    }
  });
