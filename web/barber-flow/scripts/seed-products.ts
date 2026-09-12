import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Products...');

  const products = [
    {
      name: 'Pomada Modeladora Matte',
      description: 'Alta fixação com efeito seco. Ideal para cortes clássicos.',
      price: 45.0,
      image: 'https://images.unsplash.com/photo-1626312675971-6c28f0970a09?q=80&w=600',
      category: 'Cabelo',
      sku: 'POM-001',
      stockQty: 50,
    },
    {
      name: 'Óleo para Barba',
      description: 'Hidratação profunda e perfume amadeirado.',
      price: 35.0,
      image: 'https://images.unsplash.com/photo-1596541539223-b1d6363c32b9?q=80&w=600',
      category: 'Barba',
      sku: 'OLE-001',
      stockQty: 30,
    },
    {
      name: 'Shampoo Refrescante',
      description: 'Mentolado, para limpeza profunda do couro cabeludo.',
      price: 32.0,
      image: 'https://images.unsplash.com/photo-1556228720-19273c5df555?q=80&w=600',
      category: 'Cabelo',
      sku: 'SHA-001',
      stockQty: 40,
    },
    {
      name: 'Pente de Madeira',
      description: 'Antiestático, ideal para alinhar a barba.',
      price: 25.0,
      image: 'https://images.unsplash.com/photo-1590159763121-7c9c80992a72?q=80&w=600',
      category: 'Acessórios',
      sku: 'PEN-001',
      stockQty: 100,
    },
    {
      name: 'Gel de Barbear Transparente',
      description: 'Para contornos precisos e barbear suave.',
      price: 28.0,
      image: 'https://images.unsplash.com/photo-1594246889241-119106bd2d52?q=80&w=600',
      category: 'Barba',
      sku: 'GEL-001',
      stockQty: 45,
    },
    {
      name: 'Cera em Pó',
      description: 'Volume e textura com acabamento natural.',
      price: 55.0,
      image: 'https://images.unsplash.com/photo-1626312675685-da2553754988?q=80&w=600',
      category: 'Cabelo',
      sku: 'CER-001',
      stockQty: 25,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  console.log('Products seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
