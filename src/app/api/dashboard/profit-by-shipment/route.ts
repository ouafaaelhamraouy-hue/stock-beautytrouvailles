import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * Get profit by shipment
 * Calculates revenue from sales linked to shipment items
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

    // Get all shipments with items
    const shipments = await prisma.shipment.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all sales to calculate revenue per product
    const sales = await prisma.sale.findMany({
      include: {
        product: true,
      },
    });

    // Group sales by product for revenue calculation
    const productRevenue = sales.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          totalRevenue: 0,
          totalQuantitySold: 0,
        };
      }
      acc[sale.productId].totalRevenue += sale.totalAmount;
      acc[sale.productId].totalQuantitySold += sale.quantity;
      return acc;
    }, {} as Record<string, { totalRevenue: number; totalQuantitySold: number }>);

    // Calculate profit for each shipment
    const shipmentProfits = shipments.map((shipment) => {
      // Calculate shipment cost
      const itemsCostEUR = shipment.items.reduce(
        (sum, item) => sum + item.quantity * item.costPerUnitEUR,
        0
      );
      const totalCostEUR = shipment.shippingCostEUR +
        shipment.customsCostEUR +
        shipment.packagingCostEUR +
        itemsCostEUR;
      const totalCostDH = totalCostEUR * shipment.exchangeRate;

      // Calculate revenue from this shipment (simplified - distribute revenue by quantity sold)
      // This is a simplified calculation - in reality, we'd need to track which sale came from which shipment item
      let totalRevenueEUR = 0;
      let totalQuantitySold = 0;

      shipment.items.forEach((item) => {
        const productStats = productRevenue[item.productId];
        if (productStats) {
          // Distribute revenue proportionally based on quantity sold from this item
          const itemRevenueRatio = item.quantitySold / productStats.totalQuantitySold;
          totalRevenueEUR += productStats.totalRevenue * itemRevenueRatio;
          totalQuantitySold += item.quantitySold;
        }
      });

      const totalRevenueDH = totalRevenueEUR * shipment.exchangeRate;
      const profitEUR = totalRevenueEUR - totalCostEUR;
      const profitDH = totalRevenueDH - totalCostDH;
      const marginPercent = totalCostEUR > 0
        ? ((profitEUR / totalCostEUR) * 100)
        : 0;

      return {
        shipmentId: shipment.id,
        reference: shipment.reference,
        supplier: shipment.supplier.name,
        status: shipment.status,
        arrivalDate: shipment.arrivalDate,
        totalCostEUR,
        totalCostDH,
        totalRevenueEUR,
        totalRevenueDH,
        profitEUR,
        profitDH,
        marginPercent,
        itemsCount: shipment.items.length,
        totalQuantitySold,
      };
    });

    return NextResponse.json(shipmentProfits);
  } catch (error) {
    console.error('Error fetching profit by shipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
