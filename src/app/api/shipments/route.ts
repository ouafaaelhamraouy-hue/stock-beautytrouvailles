import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '100');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 100;
    const sortParam = searchParams.get('sort') || 'createdAt';
    const allowedSorts = new Set([
      'createdAt',
      'updatedAt',
      'purchaseDate',
      'shipDate',
      'receivedDate',
    ]);
    const sort = allowedSorts.has(sortParam) ? sortParam : 'createdAt';

    // Fetch arrivages (shipments)
    const arrivages = await prisma.arrivage.findMany({
      where: { organizationId: userProfile.organizationId },
      include: {
        products: {
          include: {
            category: true,
            brand: true,
          },
        },
        expenses: true,
      },
      orderBy: {
        [sort]: 'desc',
      },
      take: limit,
    });

    // Format response to match expected structure
    const toNumber = (value: unknown) =>
      typeof value === 'number'
        ? value
        : typeof (value as { toNumber?: () => number })?.toNumber === 'function'
          ? (value as { toNumber: () => number }).toNumber()
          : Number(value) || 0;

    const shipments = [];
    for (const arrivage of arrivages) {
      const exchangeRate = toNumber(arrivage.exchangeRate) || 10.85;
      const itemsCostEur = (arrivage.products || []).reduce((sum, product) => {
        const qty = product.quantityReceived || 0;
        const priceEur = toNumber(product.purchasePriceEur);
        const priceMad = toNumber(product.purchasePriceMad);
        const unitEur = priceEur || (priceMad ? priceMad / exchangeRate : 0);
        return sum + qty * unitEur;
      }, 0);
      const expensesEur = (arrivage.expenses || []).reduce(
        (sum, expense) => sum + toNumber(expense.amountEUR),
        0
      );
      const computedTotalCostEur = Number((itemsCostEur + expensesEur).toFixed(2));
      const computedTotalCostDh = Number((computedTotalCostEur * exchangeRate).toFixed(2));

      const storedTotalCostEur = toNumber(arrivage.totalCostEur);
      const storedTotalCostDh = toNumber(arrivage.totalCostDh);

      if (
        Math.abs(computedTotalCostEur - storedTotalCostEur) > 0.01 ||
        Math.abs(computedTotalCostDh - storedTotalCostDh) > 0.01
      ) {
        await prisma.arrivage.update({
          where: { id: arrivage.id },
          data: {
            totalCostEur: computedTotalCostEur,
            totalCostDh: computedTotalCostDh,
          },
        });
      }

      shipments.push({
        id: arrivage.id,
        reference: arrivage.reference,
        purchaseDate: arrivage.purchaseDate,
        shipDate: arrivage.shipDate,
        receivedDate: arrivage.receivedDate,
        status: arrivage.status,
        source: arrivage.source,
        invoices: arrivage.invoices,
        exchangeRate,
        totalCostEur: computedTotalCostEur,
        shippingCostEur: toNumber(arrivage.shippingCostEur),
        packagingCostEur: toNumber(arrivage.packagingCostEur),
        totalCostDh: computedTotalCostDh,
        productCount: arrivage.productCount,
        totalUnits: arrivage.totalUnits,
        carrier: arrivage.carrier,
        trackingNumber: arrivage.trackingNumber,
        notes: arrivage.notes,
        products: arrivage.products,
        expenses: arrivage.expenses,
        createdAt: arrivage.createdAt,
        updatedAt: arrivage.updatedAt,
      });
    }

    return NextResponse.json({ shipments });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    if (!hasPermission(userProfile.role, 'ARRIVAGES_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      reference,
      purchaseDate,
      shipDate,
      receivedDate,
      status,
      source,
      invoices,
      exchangeRate,
      shippingCostEur,
      packagingCostEur,
      carrier,
      trackingNumber,
      notes,
    } = body;

    const exchangeRateValue = exchangeRate || 10.85;
    const totalCostEurValue = 0;
    const totalCostDhValue = 0;

    // Check if reference already exists
    const existingArrivage = await prisma.arrivage.findFirst({
      where: { reference, organizationId: userProfile.organizationId },
    });

    if (existingArrivage) {
      return NextResponse.json(
        { error: 'Arrivage with this reference already exists' },
        { status: 400 }
      );
    }

    // Create arrivage
    const arrivage = await prisma.arrivage.create({
      data: {
        reference,
        organizationId: userProfile.organizationId,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        shipDate: shipDate ? new Date(shipDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        status: status || 'PENDING',
        source: source || 'OTHER',
        invoices: invoices || [],
        exchangeRate: exchangeRateValue,
        shippingCostEur: shippingCostEur || 0,
        packagingCostEur: packagingCostEur || 0,
        totalCostEur: totalCostEurValue,
        totalCostDh: totalCostDhValue,
        carrier,
        trackingNumber,
        notes,
      },
      include: {
        products: true,
        expenses: true,
      },
    });

    return NextResponse.json(arrivage, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
