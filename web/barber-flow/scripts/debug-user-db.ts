import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { barbershop: true },
  });

  console.log('Users in DB:');
  users.forEach((u) => {
    console.log(`User: ${u.email} | ID: ${u.id} | Role: ${u.role}`);
    console.log(`- BarbershopId: ${u.barbershopId}`);
    console.log(`- Barbershop ID (Relation): ${u.barbershop?.id}`);
    console.log(`- Barbershop Name: ${u.barbershop?.name}`);
    console.log('---');
  });

  const shops = await prisma.barbershop.findMany();
  console.log(`Total Barbershops: ${shops.length}`);
  shops.forEach((s) => console.log(`Shop: ${s.name} (${s.id})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
