import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const defaultOrg = { name: 'BeautyTrouvailles', slug: 'beautytrouvailles' };

const brands = [
  { name: 'Rituals', country: 'Netherlands' },
  { name: 'MAX & MORE', country: 'France' }, // Action brand
  { name: 'SOL DE JANEIRO', country: 'Brazil' },
  { name: 'SPA Exclusive', country: 'France' },
  { name: 'fenzi', country: 'Poland' }, // Perfume dupes
  { name: 'YES TO', country: 'USA' },
  { name: 'Action', country: 'France' }, // Generic Action products
  { name: 'Autre', country: 'France' }, // Other
];

async function main() {
  console.log('Seeding brands...');
  const organization = await prisma.organization.upsert({
    where: { slug: defaultOrg.slug },
    update: {},
    create: { name: defaultOrg.name, slug: defaultOrg.slug },
  });

  for (const brand of brands) {
    const result = await prisma.brand.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: brand.name,
        },
      },
      update: {
        country: brand.country,
      },
      create: { ...brand, organizationId: organization.id },
    });
    console.log(`✓ ${result.name}`);
  }

  console.log('Brands seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
