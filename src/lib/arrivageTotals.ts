import { prisma } from '@/lib/prisma';

export async function recalcArrivageTotals(arrivageId: string, organizationId: string) {
  const arrivage = await prisma.arrivage.findFirst({
    where: { id: arrivageId, organizationId },
    select: {
      id: true,
      exchangeRate: true,
    },
  });

  if (!arrivage) return;

  const exchangeRate = arrivage.exchangeRate.toNumber();

  const [products, expenseSums] = await Promise.all([
    prisma.product.findMany({
      where: { arrivageId, isActive: true, organizationId },
      select: {
        quantityReceived: true,
        purchasePriceEur: true,
        purchasePriceMad: true,
      },
    }),
    prisma.expense.aggregate({
      where: { arrivageId, organizationId },
      _sum: {
        amountEUR: true,
      },
    }),
  ]);

  const itemsCostEur = products.reduce((sum, product) => {
    const qty = product.quantityReceived || 0;
    const priceEur = product.purchasePriceEur?.toNumber();
    const priceMad = product.purchasePriceMad?.toNumber();
    const unitEur = priceEur ?? (priceMad ? priceMad / exchangeRate : 0);
    return sum + qty * unitEur;
  }, 0);

  const expensesEur = expenseSums._sum.amountEUR?.toNumber() || 0;
  const totalCostEur = Number((itemsCostEur + expensesEur).toFixed(2));
  const totalCostDh = Number((totalCostEur * exchangeRate).toFixed(2));

  await prisma.arrivage.updateMany({
    where: { id: arrivageId, organizationId },
    data: {
      totalCostEur,
      totalCostDh,
    },
  });
}
