import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const defaultOrg = { name: 'BeautyTrouvailles', slug: 'beautytrouvailles' };

async function main() {
  console.log('🌱 Seeding database...');
  const organization = await prisma.organization.upsert({
    where: { slug: defaultOrg.slug },
    update: {},
    create: { name: defaultOrg.name, slug: defaultOrg.slug },
  });

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
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: category.name,
        },
      },
      update: {},
      create: { ...category, organizationId: organization.id },
    });
    console.log(`✅ Category: ${category.name}`);
  }

  // Note: Suppliers are not used in this schema
  // The schema uses PurchaseSource enum instead (ACTION, RITUALS, NOCIBE, etc.)

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
