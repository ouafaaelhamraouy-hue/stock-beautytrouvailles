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
    const arrivageId = searchParams.get('arrivageId');
    const categoryId = searchParams.get('categoryId');
    const stockLevel = searchParams.get('stockLevel'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    const productId = searchParams.get('productId');
    const search = searchParams.get('search');

    // Build where clause for products
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (arrivageId) {
      where.arrivageId = arrivageId;
    }
    if (productId) {
      where.id = productId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get products with their relations
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        arrivage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate inventory status and filter by stock level
    const inventoryItems = products.map((product) => {
      const quantityReceived = product.quantityReceived;
      const quantitySold = product.quantitySold;
      const quantityRemaining = quantityReceived - quantitySold;
      const stockPercentage = quantityReceived > 0
        ? (quantityRemaining / quantityReceived) * 100
        : 0;

      // Determine stock status
      let status: 'in_stock' | 'low_stock' | 'out_of_stock';
      if (quantityRemaining <= 0) {
        status = 'out_of_stock';
      } else if (quantityRemaining <= product.reorderLevel) {
        status = 'low_stock';
      } else {
        status = 'in_stock';
      }

      return {
        id: product.id,
        product: {
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          brandId: product.brandId,
          imageUrl: product.imageUrl,
          purchaseSource: product.purchaseSource,
          purchasePriceEur: product.purchasePriceEur ? Number(product.purchasePriceEur) : null,
          purchasePriceMad: Number(product.purchasePriceMad),
          sellingPriceDh: Number(product.sellingPriceDh),
          promoPriceDh: product.promoPriceDh ? Number(product.promoPriceDh) : null,
          reorderLevel: product.reorderLevel,
          category: product.category,
          brand: product.brand,
        },
        arrivage: product.arrivage,
        quantity: quantityReceived,
        quantitySold,
        quantityRemaining,
        stockPercentage,
        status,
        costPerUnitMad: Number(product.purchasePriceMad),
        costPerUnitEur: product.purchasePriceEur ? Number(product.purchasePriceEur) : null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
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
