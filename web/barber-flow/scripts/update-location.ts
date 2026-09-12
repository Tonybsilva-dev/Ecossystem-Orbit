import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const city = process.argv[2];
  const state = process.argv[3];

  if (!city || !state) {
    console.error('Usage: npx tsx scripts/update-location.ts <City> <State>');
    console.error('Example: npx tsx scripts/update-location.ts "São Paulo" "SP"');
    process.exit(1);
  }

  console.log(`Updating Barbershop location to: ${city}, ${state}...`);

  try {
    const shop = await prisma.barbershop.findFirst();

    if (!shop) {
      console.error('No barbershop found! Run onboarding first or seed db.');
      process.exit(1);
    }

    const updated = await prisma.barbershop.update({
      where: { id: shop.id },
      data: {
        city: city,
        state: state,
      },
    });

    console.log('✅ Location updated successfully!');
    console.log('ID:', updated.id);
    console.log('City:', updated.city);
    console.log('State:', updated.state);
  } catch (error) {
    console.error('Error updating location:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
