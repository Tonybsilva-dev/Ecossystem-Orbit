import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const status = process.argv[2];

  if (!status) {
    console.error('Usage: npx tsx scripts/set-license-status.ts <ACTIVE|PENDING|EXPIRED>');
    process.exit(1);
  }

  console.log(`Updating License Status to: ${status}...`);

  try {
    const shop = await prisma.barbershop.findFirst();

    if (!shop) {
      console.error('No barbershop found!');
      process.exit(1);
    }

    const updated = await prisma.barbershop.update({
      where: { id: shop.id },
      data: {
        licenseStatus: status,
      },
    });

    console.log('✅ License updated successfully!');
    console.log('Status:', updated.licenseStatus);
  } catch (error) {
    console.error('Error updating license:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
