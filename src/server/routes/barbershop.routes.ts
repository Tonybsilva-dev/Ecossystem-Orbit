import { Hono } from 'hono';
import { prisma } from '../db';
import { generateSlug } from '../../shared/utils/string.utils';
import { auth } from '../../features/auth/auth';

export const barbershopRouter = new Hono()
  .get('/', async (c) => {
    try {
      // 1. Check Header (for explicit context switching if implemented)
      const tenantId = c.req.header('X-Barbershop-ID');
      if (tenantId) {
        const shop = await prisma.barbershop.findUnique({ where: { id: tenantId } });
        return c.json(shop || null);
      }

      // 2. Check Session (Main path for logged-in users)
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (session && session.user.barbershopId) {
        const shop = await prisma.barbershop.findUnique({
          where: { id: session.user.barbershopId },
        });
        return c.json(shop || null);
      }

      // 3. No shop found
      return c.json(null);
    } catch (error) {
      console.error('Fetch Barbershop Error:', error);
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
      // Multi-tenancy fix: Only update if USER has a shop. Otherwise always create new.
      let existing = null;
      if (session.user.barbershopId) {
        existing = await prisma.barbershop.findUnique({
          where: { id: session.user.barbershopId },
        });
      }

      const isTrial = body.licenseKey === 'TRIAL-VERSION';
      const isNewSubscription = body.licenseKey === 'NEW_SUBSCRIPTION' && body.planId;

      let licenseStatus = isTrial ? 'TRIAL' : 'PENDING';
      let planType = isTrial ? 'FREE' : 'BASIC';
      let modules: string[] = [];
      let finalLicenseKey = body.licenseKey;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let limits: any = {};

      if (isNewSubscription) {
        // Create Subscription in ORBIT
        try {
          const user = await prisma.user.findUnique({ where: { id: session.user.id } });

          if (!user || (!user.email && !session.user.email)) {
            return c.json({ error: 'User email required for subscription.' }, 400);
          }

          const subscriptionData = {
            tenantName: body.name || existing?.name || 'New Barbershop',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            email: user.email || (session.user as any).email,
            planId: body.planId,
            slug: existing?.slug || generateSlug(body.name),
            interval: body.interval, // Pass the selected interval (MONTHLY or YEARLY)
          };

          const orbitUrl = process.env.ORBIT_API_URL || 'http://localhost:5179';

          const response = await fetch(`${orbitUrl}/api/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionData),
          });

          if (!response.ok) {
            const errData = await response.json();
            return c.json(
              { error: errData.error || 'Failed to create subscription in Orbit' },
              400,
            );
          }

          const data = await response.json();
          // data should contain { licenseKey, plan, ... }
          finalLicenseKey = data.licenseKey;
          licenseStatus = 'ACTIVE';

          const planName = data.plan?.name?.toUpperCase() || 'BASIC';
          if (planName.includes('PRO')) planType = 'PRO';
          else if (planName.includes('ENTERPRISE')) planType = 'ENTERPRISE';
          else planType = 'BASIC';

          modules = data.plan?.features || [];
          limits = data.plan?.limits || {};
        } catch (error) {
          console.error('Orbit Subscription Creation Error:', error);
          return c.json({ error: 'Failed to communicate with Licensing Server.' }, 500);
        }
      } else if (!isTrial && body.licenseKey) {
        // Validate Existing License
        try {
          const orbitUrl = process.env.ORBIT_API_URL || 'http://localhost:5179'; // Ensure port 5179
          const response = await fetch(`${orbitUrl}/api/validate?licenseKey=${body.licenseKey}`, {
            headers: { Origin: 'http://localhost:3333' },
          });

          if (response.ok) {
            const data = (await response.json()) as { valid: boolean; capabilities: string[] };
            if (data.valid) {
              licenseStatus = 'ACTIVE';
              modules = data.capabilities;
              // Validation endpoint currently returns capabilities (features).
              // We might need to update validate endpoint to return limits too.
              // For now, limits will be empty on validation if not updated.
            } else {
              return c.json({ error: 'Licença inválida ou inativa.' }, 400);
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

      const licenseStatusEnum = licenseStatus as 'TRIAL' | 'PENDING' | 'ACTIVE' | 'EXPIRED';
      const planTypeEnum = planType as 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'TRIAL';

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { planId: _planId, interval: _interval, ...validBody } = body;

      let shop;
      if (existing) {
        let slug = existing.slug;
        if (!slug && validBody.name) {
          slug = generateSlug(validBody.name);
        }

        shop = await prisma.barbershop.update({
          where: { id: existing.id },
          data: {
            ...validBody,
            slug,
            licenseKey: finalLicenseKey, // Update key
            licenseStatus: licenseStatusEnum,
            planType: planTypeEnum,
            modules,
            limits,
          },
        });
      } else {
        const slug = generateSlug(validBody.name);

        shop = await prisma.barbershop.create({
          data: {
            ...validBody,
            slug,
            licenseKey: finalLicenseKey,
            licenseStatus: licenseStatusEnum,
            planType: planTypeEnum,
            modules,
            limits,
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
  })
  .get('/dashboard', async (c) => {
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session || !session.user.barbershopId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const shopId = session.user.barbershopId;
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const todayEnd = new Date(now.setHours(23, 59, 59, 999));

      // 1. Appointments Today
      const appointmentsToday = await prisma.appointment.count({
        where: {
          barbershopId: shopId,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      // 2. Revenue Today (Appointments only for now, can add Orders later)
      // Assuming 'COMPLETED' appointments count as revenue
      const completedAppointments = await prisma.appointment.findMany({
        where: {
          barbershopId: shopId,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: 'COMPLETED',
        },
        include: { service: true },
      });

      const revenueToday = completedAppointments.reduce((acc, curr) => {
        return acc + Number(curr.service.price);
      }, 0);

      // 3. New Clients (Users created today linked to this shop)
      // Note: In strict SaaS, 'new clients' might mean people who booked for the first time.
      // Simpler proxy: Users created today.
      const newClients = await prisma.user.count({
        where: {
          barbershopId: shopId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          role: 'USER',
        },
      });

      // 4. Recent Activity (Last 5 appointments)
      const recentActivityRaw = await prisma.appointment.findMany({
        where: { barbershopId: shopId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: true, service: true },
      });

      const recentActivity = recentActivityRaw.map((a) => ({
        id: a.id,
        user: a.user.name || a.user.email,
        action: `agendou ${a.service.name}`,
        time: a.createdAt, // Frontend handles formatting
      }));

      // 5. Ticket Average (Revenue / Count)
      const ticketAverage =
        completedAppointments.length > 0 ? revenueToday / completedAppointments.length : 0;

      return c.json({
        kpis: [
          { label: 'Faturamento Hoje', value: revenueToday, type: 'currency', change: '+0%' }, // Change is mock for now
          { label: 'Agendamentos', value: appointmentsToday, type: 'number', change: '+0%' },
          { label: 'Novos Clientes', value: newClients, type: 'number', change: '+0%' },
          { label: 'Ticket Médio', value: ticketAverage, type: 'currency', change: '0%' },
        ],
        recentActivity,
      });
    } catch (error) {
      console.error('Dashboard Stats Error:', error);
      return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
    }
  });
