import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * Get profit by arrivage
 * Calculates revenue from sales linked to products in each arrivage
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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    if (!hasPermission(userProfile.role, 'DASHBOARD_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all arrivages with their products
    const arrivages = await prisma.arrivage.findMany({
      where: { organizationId: userProfile.organizationId },
      include: {
        products: {
          include: {
            category: true,
            brand: true,
            sales: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate profit for each arrivage
    const arrivageProfits = arrivages.map((arrivage) => {
      // Calculate total cost (from arrivage)
      const totalCostEur = Number(arrivage.totalCostEur) || 0;
      const totalCostDh = Number(arrivage.totalCostDh) || 0;
      const exchangeRate = Number(arrivage.exchangeRate) || 10.85;

      // Calculate total revenue from sales of products in this arrivage
      let totalRevenueDh = 0;
      let totalQuantitySold = 0;
      let totalCostOfGoodsSoldDh = 0;

      arrivage.products.forEach((product) => {
        const productSales = product.sales || [];
        const purchasePriceMad = Number(product.purchasePriceMad) || 0;
        
        productSales.forEach((sale) => {
          const saleQuantity = sale.quantity ?? 0;
          totalRevenueDh += Number(sale.totalAmount) || 0;
          totalQuantitySold += saleQuantity;
          // Cost of goods sold for this sale
          totalCostOfGoodsSoldDh += saleQuantity * purchasePriceMad;
        });
      });

      // Calculate gross profit (revenue - cost of goods sold)
      const grossProfitDh = totalRevenueDh - totalCostOfGoodsSoldDh;
      
      // Calculate net profit (gross profit - overhead costs like shipping, packaging)
      // Allocate overhead costs proportionally based on quantity sold
      const totalUnits = arrivage.totalUnits || 1;
      const overheadPerUnit = totalUnits > 0 ? totalCostDh / totalUnits : 0;
      const allocatedOverhead = overheadPerUnit * totalQuantitySold;
      const netProfitDh = grossProfitDh - allocatedOverhead;
      
      // Convert to EUR for reporting
      const grossProfitEur = grossProfitDh / exchangeRate;
      const netProfitEur = netProfitDh / exchangeRate;

      // Calculate margin percentage
      const marginPercent = totalRevenueDh > 0
        ? ((grossProfitDh / totalRevenueDh) * 100)
        : 0;

      return {
        arrivageId: arrivage.id,
        reference: arrivage.reference,
        source: arrivage.source,
        status: arrivage.status,
        receivedDate: arrivage.receivedDate,
        purchaseDate: arrivage.purchaseDate,
        totalCostEur,
        totalCostDh,
        totalRevenueDh,
        totalRevenueEur: totalRevenueDh / exchangeRate,
        grossProfitDh,
        grossProfitEur,
        netProfitDh,
        netProfitEur,
        marginPercent,
        productCount: arrivage.productCount || arrivage.products.length,
        totalQuantitySold,
      };
    });

    return NextResponse.json(arrivageProfits);
  } catch (error) {
    console.error('Error fetching profit by arrivage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
