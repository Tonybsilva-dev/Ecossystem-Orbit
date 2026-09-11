import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/auth/password.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@orbit.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123"; // Change on first login
  const systemTenantSlug = "orbit-admin";

  // 1. Create or Get System Tenant
  let tenant = await prisma.tenant.findUnique({ where: { slug: systemTenantSlug } });

  if (!tenant) {
    console.log("Creating system tenant...");
    tenant = await prisma.tenant.create({
      data: { name: "Orbit Control Plane", slug: systemTenantSlug, status: "ACTIVE" },
    });
    console.log(`✅ System tenant created: ${tenant.id}`);
  } else {
    console.log(`ℹ️ System tenant already exists: ${tenant.id}`);
  }

  // 2. Create or Get Admin User (operador único da plataforma)
  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingUser) {
    console.log("Creating admin user...");
    const hashedPassword = await hashPassword(adminPassword);

    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Super Admin",
        passwordHash: hashedPassword,
        role: "OWNER",
        tenantId: tenant.id,
      },
    });
    console.log(`✅ Admin user created: ${user.id}`);
    console.log(`🔑 Credentials: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${existingUser.id}`);
  }

  // 3. Create BarberFlow Product
  const bfSlug = "barberflow";
  let product = await prisma.product.findUnique({ where: { slug: bfSlug } });

  if (!product) {
    console.log("Creating BarberFlow product...");
    product = await prisma.product.create({
      data: {
        name: "BarberFlow",
        slug: bfSlug,
        description: "Software de gestão para barbearias",
        apiKey: "bf_live_" + Math.random().toString(36).substring(7),
      },
    });
    console.log(`✅ Product created: ${product.id}`);
  } else {
    console.log(`ℹ️ Product already exists: ${product.id}`);
  }

  // 4. Create Features
  const allFeatures = [
    { key: "appointments", name: "Agendamentos" },
    { key: "barbers", name: "Barbeiros" },
    { key: "services", name: "Serviços" },
    { key: "products", name: "Produtos" },
    { key: "financial", name: "Financeiro" },
    { key: "whatsapp", name: "WhatsApp" },
    { key: "dashboard", name: "Dashboard" },
  ];

  const featureMap: Record<string, string> = {};

  for (const f of allFeatures) {
    const feature = await prisma.feature.upsert({
      where: { productId_key: { productId: product.id, key: f.key } },
      update: { name: f.name },
      create: { productId: product.id, key: f.key, name: f.name },
    });
    featureMap[f.key] = feature.id;
    console.log(`✅ Feature sync: ${f.name}`);
  }

  // 5. Create Plans with Limits and Features
  const plans = [
    {
      name: "Free",
      price: 0.0,
      features: ["dashboard"],
      limits: { max_appointments_monthly: 100, max_barbers: 1, max_services: 5, max_products: 10 },
      legacy: ["AGENDA_LIMITADA"],
    },
    {
      name: "Basic",
      price: 29.9,
      features: ["dashboard", "appointments", "barbers", "services", "products", "financial"],
      limits: { max_appointments_monthly: -1, max_barbers: 3, max_services: 20, max_products: 50 },
      legacy: ["AGENDA", "CLIENTES"],
    },
    {
      name: "Pro",
      price: 59.9,
      features: ["dashboard", "appointments", "barbers", "services", "products", "financial", "whatsapp"],
      limits: { max_appointments_monthly: -1, max_barbers: 10, max_services: -1, max_products: -1 },
      legacy: ["AGENDA", "CLIENTES", "FINANCEIRO", "WHATSAPP"],
    },
    {
      name: "Enterprise",
      price: 99.9,
      features: ["dashboard", "appointments", "barbers", "services", "products", "financial", "whatsapp"],
      limits: { max_appointments_monthly: -1, max_barbers: -1, max_services: -1, max_products: -1 },
      legacy: ["ALL"],
    },
  ];

  for (const p of plans) {
    const existingPlan = await prisma.plan.findFirst({ where: { productId: product.id, name: p.name } });
    const featureConnect = p.features.map((k) => ({ id: featureMap[k] }));

    if (!existingPlan) {
      await prisma.plan.create({
        data: {
          productId: product.id,
          name: p.name,
          price: p.price,
          features: p.legacy,
          limits: p.limits,
          includedFeatures: { connect: featureConnect },
        },
      });
      console.log(`✅ Plan created: ${p.name}`);
    } else {
      await prisma.plan.update({
        where: { id: existingPlan.id },
        data: { limits: p.limits, includedFeatures: { set: featureConnect } },
      });
      console.log(`🔄 Plan updated: ${p.name}`);
    }
  }

  console.log("🌱 Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
