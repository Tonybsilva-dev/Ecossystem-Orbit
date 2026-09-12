import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Barbershop...');

  try {
    // Check if exists
    const existing = await prisma.barbershop.findFirst();
    if (existing) {
      console.log('Barbershop already exists:', existing);
      // Update it
      const updated = await prisma.barbershop.update({
        where: { id: existing.id },
        data: {
          city: 'São Sebastião de Lagoa de Roça',
          state: 'PB',
          name: 'Barbearia do Flavinho',
          licenseStatus: 'ACTIVE',
        },
      });
      console.log('Updated to:', updated);
      return;
    }

    const shop = await prisma.barbershop.create({
      data: {
        name: 'Barbearia do Flavinho',
        cnpj: '00.000.000/0001-00',
        phone: '83999999999',
        address: 'Centro',
        city: 'São Sebastião de Lagoa de Roça',
        state: 'PB',
        zipCode: '58125-000',
        licenseKey: 'TEST-KEY-1234',
        licenseStatus: 'ACTIVE',
        planType: 'PREMIUM',
        modules: ['SCHEDULING', 'SHOP', 'FINANCE'],
      },
    });

    console.log('✅ Barbershop seeded successfully:', shop);
  } catch (error) {
    console.error('Error seeding shop:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
