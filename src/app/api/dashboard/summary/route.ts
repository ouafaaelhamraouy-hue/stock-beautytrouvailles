import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { calculateMargin, calculateNetMargin } from '@/lib/calculations';

/**
 * Aggregated dashboard summary endpoint
 * Returns all dashboard data in a single request to reduce network waterfalls
 */
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

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Parallelize all queries for maximum performance
    const [
      totalProducts,
      totalShipments,
      salesThisMonth,
      productsForInventory,
      productsForMargin,
      totalRevenue,
      recentSales,
      topProducts,
      packagingSetting,
    ] = await Promise.all([
      // Total active products
      prisma.product.count({
        where: { isActive: true },
      }),
      // Total arrivages
      prisma.arrivage.count(),
      // Sales this month
      prisma.sale.count({
        where: {
          saleDate: {
            gte: startOfMonth,
          },
        },
      }),
      // Products for inventory value calculation
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          quantityReceived: true,
          quantitySold: true,
          sellingPriceDh: true,
        },
      }),
      // Products for margin calculation
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          purchasePriceMad: true,
          sellingPriceDh: true,
          quantityReceived: true,
          quantitySold: true,
          reorderLevel: true,
          name: true,
          category: {
            select: {
              name: true,
              nameFr: true,
            },
          },
        },
      }),
      // Total revenue
      prisma.sale.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
      // Recent sales (last 5)
      prisma.sale.findMany({
        take: 5,
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
      }),
      // Top products by quantity sold
      prisma.product.findMany({
        where: {
          isActive: true,
          quantitySold: {
            gt: 0,
          },
        },
        select: {
          id: true,
          name: true,
          quantitySold: true,
          category: {
            select: {
              name: true,
              nameFr: true,
            },
          },
        },
        orderBy: {
          quantitySold: 'desc',
        },
        take: 5,
      }),
      // Packaging cost setting
      prisma.setting.findUnique({
        where: { key: 'packagingCostTotal' },
      }),
    ]);

    // Calculate inventory value
    const inventoryValue = productsForInventory.reduce((sum, p) => {
      const stock = p.quantityReceived - p.quantitySold;
      return sum + (stock > 0 ? Number(p.sellingPriceDh) * stock : 0);
    }, 0);

    // Calculate low stock count and list
    const lowStockList = productsForMargin
      .map((product) => {
        const currentStock = product.quantityReceived - product.quantitySold;
        return {
          id: product.name, // Using name as ID for now
          name: product.name,
          currentStock,
          reorderLevel: product.reorderLevel,
          category: product.category.nameFr || product.category.name,
        };
      })
      .filter((product) => product.currentStock <= product.reorderLevel || product.currentStock === 0)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 10);

    const lowStockCount = lowStockList.length;

    // Calculate margins
    const packagingCost = packagingSetting ? parseFloat(packagingSetting.value) : 8.00;
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

    // Format top products
    const topProductsFormatted = topProducts.map((product) => ({
      name: product.name,
      totalSold: product.quantitySold,
      category: product.category.nameFr || product.category.name,
    }));

    // Format recent sales
    const recentSalesFormatted = recentSales.map((sale) => ({
      id: sale.id,
      saleDate: sale.saleDate,
      product: {
        id: sale.product.id,
        name: sale.product.name,
        category: {
          name: sale.product.category.name,
        },
      },
      quantity: sale.quantity,
      totalAmount: sale.totalAmount,
    }));

    return NextResponse.json({
      // Stats
      stats: {
        totalProducts,
        totalShipments,
        salesThisMonth,
        inventoryValue,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        lowStockCount,
        averageMargin: Number(averageMargin.toFixed(2)),
        averageNetMargin: Number(averageNetMargin.toFixed(2)),
        packagingCost,
      },
      // Lists
      lowStock: lowStockList,
      topProducts: topProductsFormatted,
      recentSales: recentSalesFormatted,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
