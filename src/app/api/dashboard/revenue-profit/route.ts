import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

type TrendPoint = {
  date: string;
  revenue: number;
  profit: number;
};

const PERIODS = new Set(['7', '30', '90']);

function normalizePeriod(value: string | null) {
  if (!value) return 30;
  return PERIODS.has(value) ? Number(value) : 30;
}

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
      select: { id: true, isActive: true, organizationId: true },
    });

    if (!userProfile || !userProfile.isActive) {
      return NextResponse.json({ error: 'User not active' }, { status: 403 });
    }

    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = normalizePeriod(searchParams.get('period'));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (period - 1));
    startDate.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: {
        organizationId: userProfile.organizationId,
        saleDate: {
          gte: startDate,
        },
      },
      select: {
        saleDate: true,
        totalAmount: true,
        quantity: true,
        pricePerUnit: true,
        productId: true,
        product: {
          select: {
            purchasePriceMad: true,
          },
        },
        items: {
          select: {
            quantity: true,
            pricePerUnit: true,
            product: {
              select: {
                purchasePriceMad: true,
              },
            },
          },
        },
      },
      orderBy: {
        saleDate: 'asc',
      },
    });

    const buckets = new Map<string, TrendPoint>();
    for (let i = 0; i < period; i += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      buckets.set(key, {
        date: key,
        revenue: 0,
        profit: 0,
      });
    }

    const toNumber = (value: unknown) => {
      if (value == null) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return Number(value) || 0;
      if (typeof value === 'object' && value && 'toNumber' in value) {
        return (value as { toNumber: () => number }).toNumber();
      }
      return 0;
    };

    sales.forEach((sale) => {
      const dayKey = sale.saleDate.toISOString().slice(0, 10);
      const bucket = buckets.get(dayKey);
      if (!bucket) return;

      if (sale.productId && sale.quantity != null) {
        const revenue = toNumber(sale.totalAmount ?? 0);
        const cost = toNumber(sale.product?.purchasePriceMad) * sale.quantity;
        bucket.revenue += revenue;
        bucket.profit += revenue - cost;
        return;
      }

      if (sale.items.length > 0) {
        let revenue = 0;
        let cost = 0;
        sale.items.forEach((item) => {
          revenue += toNumber(item.pricePerUnit) * item.quantity;
          cost += toNumber(item.product?.purchasePriceMad) * item.quantity;
        });
        bucket.revenue += revenue;
        bucket.profit += revenue - cost;
        return;
      }

      const fallbackRevenue = toNumber(sale.totalAmount ?? 0);
      bucket.revenue += fallbackRevenue;
      bucket.profit += fallbackRevenue;
    });

    const data = Array.from(buckets.values()).map((point) => ({
      date: point.date,
      revenue: Number(point.revenue.toFixed(2)),
      profit: Number(point.profit.toFixed(2)),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching revenue profit trend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
