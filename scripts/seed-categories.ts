import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const defaultOrg = { name: 'BeautyTrouvailles', slug: 'beautytrouvailles' };

const categories = [
  {
    name: 'Soins',
    nameFr: 'Soins (Skincare)',
    targetMargin: 50,
    minMargin: 35,
    color: '#E8F5E9',
  },
  {
    name: 'Coffrets Cadeaux',
    nameFr: 'Coffrets Cadeaux',
    targetMargin: 45,
    minMargin: 30,
    color: '#FFF3E0',
  },
  {
    name: 'Maquillage',
    nameFr: 'Maquillage',
    targetMargin: 45,
    minMargin: 30,
    color: '#FCE4EC',
  },
  {
    name: 'Parfums',
    nameFr: 'Parfums',
    targetMargin: 55,
    minMargin: 40,
    color: '#F3E5F5',
  },
  {
    name: 'Autre',
    nameFr: 'Autre',
    targetMargin: 40,
    minMargin: 25,
    color: '#ECEFF1',
  },
];

async function main() {
  console.log('Seeding categories...');
  const organization = await prisma.organization.upsert({
    where: { slug: defaultOrg.slug },
    update: {},
    create: { name: defaultOrg.name, slug: defaultOrg.slug },
  });

  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: category.name,
        },
      },
      update: {
        nameFr: category.nameFr,
        targetMargin: category.targetMargin,
        minMargin: category.minMargin,
        color: category.color,
      },
      create: { ...category, organizationId: organization.id },
    });
    console.log(`✓ ${result.name}`);
  }

  console.log('Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
