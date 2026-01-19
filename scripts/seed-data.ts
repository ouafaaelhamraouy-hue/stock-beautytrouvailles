import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Categories
  const categories = [
    {
      name: 'Skincare',
      description: 'Skincare products including creams, serums, and cleansers',
    },
    {
      name: 'Makeup',
      description: 'Makeup products including foundations, lipsticks, and eyeshadows',
    },
    {
      name: 'Hair Care',
      description: 'Hair care products including shampoos, conditioners, and treatments',
    },
    {
      name: 'Fragrance',
      description: 'Perfumes and fragrances',
    },
    {
      name: 'Body Care',
      description: 'Body care products including lotions and scrubs',
    },
  ];

  console.log('📁 Creating categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`✅ Category: ${category.name}`);
  }

  // Seed Suppliers
  const suppliers = [
    {
      name: 'French Beauty Supplier',
      contactInfo: 'contact@frenchbeauty.fr | +33 1 23 45 67 89',
    },
    {
      name: 'European Cosmetics Co.',
      contactInfo: 'info@eurocosmetics.eu | +49 30 12345678',
    },
    {
      name: 'Moroccan Beauty Distributor',
      contactInfo: 'sales@moroccobeauty.ma | +212 522 123456',
    },
  ];

  console.log('🏢 Creating suppliers...');
  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { name: supplier.name },
      update: {},
      create: supplier,
    });
    console.log(`✅ Supplier: ${supplier.name}`);
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
