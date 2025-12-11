import "dotenv/config";
import { PrismaClient } from "../app/generated/client/client";
import { hashPassword } from "../app/core/auth/password.server";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  const adminEmail = "admin@orbit.com";
  const adminPassword = "admin123"; // Change on first login
  const systemTenantSlug = "orbit-admin";

  // 1. Create or Get System Tenant
  let tenant = await prisma.tenant.findUnique({
    where: { slug: systemTenantSlug },
  });

  if (!tenant) {
    console.log("Creating system tenant...");
    tenant = await prisma.tenant.create({
      data: {
        name: "Orbit Control Plane",
        slug: systemTenantSlug,
        status: "ACTIVE",
      },
    });
    console.log(`✅ System tenant created: ${tenant.id}`);
  } else {
    console.log(`ℹ️ System tenant already exists: ${tenant.id}`);
  }

  // 2. Create or Get Admin User
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

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
  let product = await prisma.product.findUnique({
    where: { slug: bfSlug },
  });

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

  // 4. Create Plans
  const plans = [
    { name: "Free", price: 0.0, features: ["AGENDA_LIMITADA"] },
    { name: "Basic", price: 29.9, features: ["AGENDA", "CLIENTES"] },
    { name: "Pro", price: 59.9, features: ["AGENDA", "CLIENTES", "FINANCEIRO", "WHATSAPP"] },
    { name: "Enterprise", price: 99.9, features: ["ALL"] },
  ];

  for (const p of plans) {
    const existingPlan = await prisma.plan.findFirst({
      where: { productId: product.id, name: p.name },
    });

    if (!existingPlan) {
      await prisma.plan.create({
        data: {
          productId: product.id,
          name: p.name,
          price: p.price,
          features: p.features,
        },
      });
      console.log(`✅ Plan created: ${p.name}`);
    } else {
      console.log(`ℹ️ Plan exists: ${p.name}`);
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
