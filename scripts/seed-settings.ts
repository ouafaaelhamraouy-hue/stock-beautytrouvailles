import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default settings from Excel Charges sheet
const DEFAULT_SETTINGS = {
  packagingCostPlastic: '1.50',
  packagingCostCarton: '6.00',
  packagingCostStickers: '0.50',
  packagingCostTotal: '8.00',
  adsCostMonthly: '150.00',
  exchangeRateEurToMad: '10.85',
};

async function main() {
  console.log('🌱 Seeding settings...');

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    console.log(`✅ Setting: ${key} = ${value}`);
  }

  console.log('✨ Settings seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
