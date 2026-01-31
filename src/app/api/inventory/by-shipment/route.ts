import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hasPermission } from '@/lib/permissions';
import { calculateMargin, calculateCurrentStock } from '@/lib/calculations';

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

    if (!hasPermission(userProfile.role, 'PRODUCTS_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const arrivageId = searchParams.get('arrivageId');
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');
    const search = searchParams.get('search');

    // Build where clause for products
    const productWhere: Prisma.ProductWhereInput = {
      isActive: true,
      organizationId: userProfile.organizationId,
    };

    if (arrivageId) {
      productWhere.arrivageId = arrivageId;
    }

    if (categoryId) {
      productWhere.categoryId = categoryId;
    }

    if (brandId) {
      productWhere.brandId = brandId;
    }

    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch arrivages with their products
    const arrivages = await prisma.arrivage.findMany({
      where: arrivageId
        ? { id: arrivageId, organizationId: userProfile.organizationId }
        : { organizationId: userProfile.organizationId },
      select: {
        id: true,
        reference: true,
        shipDate: true,
        purchaseDate: true,
        source: true,
        exchangeRate: true,
        status: true,
        products: {
          where: productWhere,
          select: {
            id: true,
            name: true,
            brandId: true,
            purchasePriceEur: true,
            purchasePriceMad: true,
            sellingPriceDh: true,
            promoPriceDh: true,
            quantityReceived: true,
            quantitySold: true,
            reorderLevel: true,
            category: {
              select: {
                id: true,
                name: true,
                nameFr: true,
                targetMargin: true,
                minMargin: true,
                color: true,
              },
            },
            brand: {
              select: {
                id: true,
                name: true,
                country: true,
              },
            },
          },
        },
      },
      orderBy: {
        shipDate: 'desc',
      },
    });

    // Process arrivages and calculate summaries
    const arrivagesWithSummary = arrivages.map((arrivage) => {
      const products = arrivage.products.map((product) => {
        const stock = calculateCurrentStock(
          product.quantityReceived,
          product.quantitySold
        );
        const margin = calculateMargin(product.sellingPriceDh, product.purchasePriceMad);

        return {
          id: product.id,
          name: product.name,
          category: product.category.name,
          categoryId: product.category.id,
          brand: product.brand?.name || null,
          brandId: product.brandId,
          purchasePriceMad: product.purchasePriceMad ? Number(product.purchasePriceMad) : 0,
          sellingPriceDh: product.sellingPriceDh ? Number(product.sellingPriceDh) : 0,
          promoPriceDh: product.promoPriceDh ? Number(product.promoPriceDh) : null,
          stock,
          sold: product.quantitySold,
          margin: isNaN(margin) ? 0 : margin,
          reorderLevel: product.reorderLevel,
        };
      });

      // Calculate summary
      const totalProducts = new Set(products.map((p) => p.name)).size;
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const totalSold = products.reduce((sum, p) => sum + p.sold, 0);
      const totalValue = products.reduce(
        (sum, p) => sum + p.sellingPriceDh * p.stock,
        0
      );

      return {
        id: arrivage.id,
        reference: arrivage.reference,
        shipDate: arrivage.shipDate?.toISOString() || null,
        purchaseDate: arrivage.purchaseDate?.toISOString() || null,
        source: arrivage.source,
        exchangeRate: arrivage.exchangeRate.toNumber(),
        status: arrivage.status,
        summary: {
          totalProducts,
          totalStock,
          totalSold,
          totalValue,
        },
        products,
      };
    });

    return NextResponse.json({ arrivages: arrivagesWithSummary });
  } catch (error: unknown) {
    console.error('Error fetching inventory by shipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
