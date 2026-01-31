import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userProfile || !userProfile.isActive) {
      return NextResponse.json({ error: 'User not active' }, { status: 403 });
    }
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    if (!hasPermission(userProfile.role, 'ARRIVAGES_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const arrivage = await prisma.arrivage.findFirst({
      where: { id, organizationId: userProfile.organizationId },
      include: {
        expenses: true,
      },
    });

    if (!arrivage) {
      return NextResponse.json({ error: 'Arrivage not found' }, { status: 404 });
    }

    const toNumber = (value: unknown) =>
      typeof value === 'number'
        ? value
        : typeof (value as { toNumber?: () => number })?.toNumber === 'function'
          ? (value as { toNumber: () => number }).toNumber()
          : Number(value) || 0;

    const exchangeRate = toNumber(arrivage.exchangeRate) || 10.85;
    const expensesDh = (arrivage.expenses || []).reduce(
      (sum, expense) => sum + toNumber(expense.amountDH),
      0
    );

    const [sales, saleItems] = await Promise.all([
      prisma.sale.findMany({
        where: {
          organizationId: userProfile.organizationId,
          product: {
            arrivageId: id,
          },
        },
        select: {
          id: true,
          quantity: true,
          pricePerUnit: true,
          totalAmount: true,
          product: {
            select: {
              purchasePriceMad: true,
            },
          },
        },
      }),
      prisma.saleItem.findMany({
        where: {
          organizationId: userProfile.organizationId,
          product: {
            arrivageId: id,
          },
        },
        select: {
          saleId: true,
          quantity: true,
          pricePerUnit: true,
          product: {
            select: {
              purchasePriceMad: true,
            },
          },
        },
      }),
    ]);

    let totalRevenueDh = 0;
    let totalQuantitySold = 0;
    let totalCostOfGoodsSoldDh = 0;
    const saleIds = new Set<string>();

    for (const sale of sales) {
      const quantity = toNumber(sale.quantity);
      const purchasePriceMad = toNumber(sale.product?.purchasePriceMad);
      const totalFromRecord = toNumber(sale.totalAmount);
      const totalFromUnit = quantity > 0 ? quantity * toNumber(sale.pricePerUnit) : 0;
      const lineTotal = totalFromRecord > 0 ? totalFromRecord : totalFromUnit;
      totalRevenueDh += lineTotal;
      totalQuantitySold += quantity;
      totalCostOfGoodsSoldDh += quantity * purchasePriceMad;
      saleIds.add(sale.id);
    }

    for (const item of saleItems) {
      const quantity = toNumber(item.quantity);
      const purchasePriceMad = toNumber(item.product?.purchasePriceMad);
      totalRevenueDh += toNumber(item.pricePerUnit) * quantity;
      totalQuantitySold += quantity;
      totalCostOfGoodsSoldDh += quantity * purchasePriceMad;
      saleIds.add(item.saleId);
    }

    const salesCount = saleIds.size;
    const totalUnits = arrivage.totalUnits || 1;
    const overheadPerUnit = totalUnits > 0 ? expensesDh / totalUnits : 0;
    const allocatedOverhead = overheadPerUnit * totalQuantitySold;
    const netProfitDh = totalRevenueDh - totalCostOfGoodsSoldDh - allocatedOverhead;
    const netProfitEur = netProfitDh / exchangeRate;
    const marginPercent = totalRevenueDh > 0 ? (netProfitDh / totalRevenueDh) * 100 : 0;

    return NextResponse.json({
      totalRevenueDh,
      totalRevenueEur: totalRevenueDh / exchangeRate,
      netProfitDh,
      netProfitEur,
      marginPercent,
      totalQuantitySold,
      salesCount,
    });
  } catch (error) {
    console.error('Error fetching arrivage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
