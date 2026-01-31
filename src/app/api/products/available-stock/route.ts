import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hasPermission } from '@/lib/permissions';

/**
 * Get available stock for products
 * Returns products with their available stock (quantityReceived - quantitySold)
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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    // Both admin and staff can read available stock for sales
    if (!hasPermission(userProfile.role, 'SALES_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameter for product ID (optional)
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const where: Prisma.ProductWhereInput = { organizationId: userProfile.organizationId };
    if (productId) {
      where.id = productId;
    }

    // Get products with category
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate available stock for each product
    const productsWithStock = products.map((product) => {
      // Available stock = quantityReceived - quantitySold
      const availableStock = product.quantityReceived - product.quantitySold;

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        sellingPriceDh: product.sellingPriceDh ? Number(product.sellingPriceDh) : 0,
        promoPriceDh: product.promoPriceDh ? Number(product.promoPriceDh) : null,
        purchasePriceMad: product.purchasePriceMad ? Number(product.purchasePriceMad) : 0,
        availableStock: Math.max(0, availableStock), // Ensure non-negative
        quantityReceived: product.quantityReceived,
        quantitySold: product.quantitySold,
        hasStock: availableStock > 0,
      };
    });

    // Filter to only products with available stock
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
