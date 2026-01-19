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

    if (!hasPermission(userProfile.role, 'INVENTORY_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get('shipmentId');
    const categoryId = searchParams.get('categoryId');
    const stockLevel = searchParams.get('stockLevel'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    const productId = searchParams.get('productId');

    // Build where clause for shipment items
    const where: any = {};
    if (shipmentId) {
      where.shipmentId = shipmentId;
    }
    if (productId) {
      where.productId = productId;
    }

    // Get shipment items with products and categories
    const shipmentItems = await prisma.shipmentItem.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by category if provided
    let filteredItems = shipmentItems;
    if (categoryId) {
      filteredItems = shipmentItems.filter(
        (item) => item.product.categoryId === categoryId
      );
    }

    // Calculate inventory status and filter by stock level
    const inventoryItems = filteredItems.map((item) => {
      const quantityRemaining = item.quantityRemaining;
      const quantitySold = item.quantitySold;
      const totalQuantity = item.quantity;
      const stockPercentage = totalQuantity > 0 
        ? (quantityRemaining / totalQuantity) * 100 
        : 0;

      // Determine stock status
      let status: 'in_stock' | 'low_stock' | 'out_of_stock';
      if (quantityRemaining === 0) {
        status = 'out_of_stock';
      } else if (stockPercentage <= 20 || quantityRemaining <= 5) {
        status = 'low_stock';
      } else {
        status = 'in_stock';
      }

      return {
        id: item.id,
        product: item.product,
        shipment: item.shipment,
        quantity: totalQuantity,
        quantitySold,
        quantityRemaining,
        stockPercentage,
        status,
        costPerUnitEUR: item.costPerUnitEUR,
        costPerUnitDH: item.costPerUnitDH,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    // Filter by stock level if provided
    let finalItems = inventoryItems;
    if (stockLevel && stockLevel !== 'all') {
      finalItems = inventoryItems.filter((item) => item.status === stockLevel);
    }

    return NextResponse.json(finalItems);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
