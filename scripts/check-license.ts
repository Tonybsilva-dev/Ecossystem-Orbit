import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.barbershop.findFirst();
  console.log('Current Shop Config:', shop);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
