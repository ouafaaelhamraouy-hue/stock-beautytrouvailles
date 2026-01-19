import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * Get low stock alerts
 * Returns products with low stock (stockPercentage <= 20% or quantityRemaining <= 5)
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

    // Get all shipment items with products
    const shipmentItems = await prisma.shipmentItem.findMany({
      include: {
        product: {
          include: {
            category: true,
          },
        },
        shipment: {
          include: {
            supplier: true,
          },
        },
      },
    });

    // Group by product and calculate totals
    const productStock = shipmentItems.reduce((acc, item) => {
      const productId = item.productId;
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          totalQuantity: 0,
          totalRemaining: 0,
          totalSold: 0,
          shipments: [] as Array<{ reference: string; supplier: string; remaining: number }>,
        };
      }
      acc[productId].totalQuantity += item.quantity;
      acc[productId].totalRemaining += item.quantityRemaining;
      acc[productId].totalSold += item.quantitySold;
      acc[productId].shipments.push({
        reference: item.shipment.reference,
        supplier: item.shipment.supplier.name,
        remaining: item.quantityRemaining,
      });
      return acc;
    }, {} as Record<string, {
      product: typeof shipmentItems[0]['product'];
      totalQuantity: number;
      totalRemaining: number;
      totalSold: number;
      shipments: Array<{ reference: string; supplier: string; remaining: number }>;
    }>);

    // Filter for low stock products
    const lowStockProducts = Object.values(productStock)
      .filter((stat) => {
        const stockPercentage = stat.totalQuantity > 0
          ? (stat.totalRemaining / stat.totalQuantity) * 100
          : 0;
        return stockPercentage <= 20 || stat.totalRemaining <= 5;
      })
      .map((stat) => {
        const stockPercentage = stat.totalQuantity > 0
          ? (stat.totalRemaining / stat.totalQuantity) * 100
          : 0;
        const status: 'low_stock' | 'out_of_stock' = stat.totalRemaining === 0
          ? 'out_of_stock'
          : 'low_stock';

        return {
          product: stat.product,
          totalQuantity: stat.totalQuantity,
          totalRemaining: stat.totalRemaining,
          totalSold: stat.totalSold,
          stockPercentage,
          status,
          shipments: stat.shipments,
        };
      })
      .sort((a, b) => a.totalRemaining - b.totalRemaining); // Sort by remaining quantity (lowest first)

    return NextResponse.json(lowStockProducts);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
