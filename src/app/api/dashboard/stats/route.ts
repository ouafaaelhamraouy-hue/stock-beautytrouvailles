import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { calculateMargin, calculateNetMargin } from '@/lib/calculations';

export async function GET() {
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

    // Dashboard is readable by all authenticated users (ADMIN and STAFF)
    // Permission check is optional here, but we keep it for consistency

    // Parallelize all queries for better performance
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalShipments,
      salesThisMonth,
      inventoryValue,
      totalRevenue,
      lowStockCount,
    ] = await Promise.all([
      // Total active products
      prisma.product.count({
        where: { isActive: true, organizationId: userProfile.organizationId },
      }),
      // Total arrivages
      prisma.arrivage.count({
        where: { organizationId: userProfile.organizationId },
      }),
      // Sales this month
      prisma.sale.count({
        where: {
          organizationId: userProfile.organizationId,
          saleDate: {
            gte: startOfMonth,
          },
        },
      }),
      // Inventory value (stock * purchase price) - optimized
      prisma.product.findMany({
        where: { isActive: true, organizationId: userProfile.organizationId },
        select: {
          quantityReceived: true,
          quantitySold: true,
          purchasePriceMad: true,
        },
      }).then((products) => {
        return products.reduce((sum, p) => {
          const stock = p.quantityReceived - p.quantitySold;
          const unitCost = p.purchasePriceMad ? Number(p.purchasePriceMad) : 0;
          return sum + (stock > 0 ? unitCost * stock : 0);
        }, 0);
      }),
      // Total revenue (from sales)
      prisma.sale.aggregate({
        where: { organizationId: userProfile.organizationId },
        _sum: {
          totalAmount: true,
        },
      }).then((result) => Number(result._sum.totalAmount || 0)),
      // Low stock count (stock <= reorderLevel or stock = 0) - optimized
      prisma.product.findMany({
        where: { isActive: true, organizationId: userProfile.organizationId },
        select: {
          quantityReceived: true,
          quantitySold: true,
          reorderLevel: true,
        },
      }).then((products) => {
        return products.filter((p) => {
          const stock = p.quantityReceived - p.quantitySold;
          return stock <= p.reorderLevel || stock === 0;
        }).length;
      }),
    ]);

    // Calculate average margin from all products (parallel with other queries)
    const productsForMargin = await prisma.product.findMany({
      where: { isActive: true, organizationId: userProfile.organizationId },
      select: {
        purchasePriceMad: true,
        sellingPriceDh: true,
      },
    });

    // Get packaging cost from settings (default 8.00 DH)
    const packagingSetting = await prisma.setting.findFirst({
      where: { key: 'packagingCostTotal', organizationId: userProfile.organizationId },
    });
    const packagingCost = packagingSetting ? parseFloat(packagingSetting.value) : 8.00;

    // Calculate both gross and net margins
    let grossMarginSum = 0;
    let netMarginSum = 0;
    let validProductCount = 0;

    productsForMargin.forEach((p) => {
      if (p.purchasePriceMad && p.purchasePriceMad.toNumber() > 0) {
        grossMarginSum += calculateMargin(p.sellingPriceDh, p.purchasePriceMad);
        netMarginSum += calculateNetMargin(p.sellingPriceDh, p.purchasePriceMad, packagingCost);
        validProductCount++;
      }
    });

    const averageMargin = validProductCount > 0 ? grossMarginSum / validProductCount : 0;
    const averageNetMargin = validProductCount > 0 ? netMarginSum / validProductCount : 0;

    return NextResponse.json({
      totalProducts,
      totalShipments,
      salesThisMonth,
      inventoryValue,
      totalRevenue,
      lowStockCount,
      averageMargin: Number(averageMargin.toFixed(2)),
      averageNetMargin: Number(averageNetMargin.toFixed(2)),
      packagingCost,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
