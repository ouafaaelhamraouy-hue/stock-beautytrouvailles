import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * Get available stock for products
 * Returns products with their available stock (quantityRemaining from shipment items)
 */
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

    // Both admin and staff can read available stock for sales
    if (!hasPermission(userProfile.role, 'SALES_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameter for product ID (optional)
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const where: any = {};
    if (productId) {
      where.id = productId;
    }

    // Get products with their shipment items
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        shipmentItems: {
          select: {
            quantityRemaining: true,
            costPerUnitEUR: true,
            costPerUnitDH: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate available stock for each product
    const productsWithStock = products.map((product) => {
      const totalAvailableStock = product.shipmentItems.reduce(
        (sum, item) => sum + item.quantityRemaining,
        0
      );

      // Get average cost (for display purposes)
      const totalItems = product.shipmentItems.length;
      const avgCostEUR = totalItems > 0
        ? product.shipmentItems.reduce((sum, item) => sum + item.costPerUnitEUR, 0) / totalItems
        : 0;

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        basePriceEUR: product.basePriceEUR,
        basePriceDH: product.basePriceDH,
        availableStock: totalAvailableStock,
        avgCostEUR,
        hasStock: totalAvailableStock > 0,
      };
    });

    // Filter to only products with available stock if needed
    // For sales, we typically want to show only products with stock
    const filteredProducts = productsWithStock.filter((p) => p.hasStock);

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('Error fetching available stock:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
