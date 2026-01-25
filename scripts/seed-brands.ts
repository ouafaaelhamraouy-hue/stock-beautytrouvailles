import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  for (const brand of brands) {
    const result = await prisma.brand.upsert({
      where: { name: brand.name },
      update: {
        country: brand.country,
      },
      create: brand,
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
