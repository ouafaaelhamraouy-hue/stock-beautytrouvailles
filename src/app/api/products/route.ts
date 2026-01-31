import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma, PurchaseSource } from '@prisma/client';
import { hasPermission } from '@/lib/permissions';
import { calculateMargin, calculateNetMargin, calculateCurrentStock } from '@/lib/calculations';
import { recalcArrivageTotals } from '@/lib/arrivageTotals';

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

    // Get user profile to check role
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
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const sourceParam = searchParams.get('source');
    const source = sourceParam && Object.values(PurchaseSource).includes(sourceParam as PurchaseSource)
      ? (sourceParam as PurchaseSource)
      : undefined;
    const stockFilter = searchParams.get('stock'); // 'low', 'out', 'ok'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100); // Max 100, default 25

    // Build where clause with stock filtering at database level
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      organizationId: userProfile.organizationId,
    };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (source) {
      where.purchaseSource = source;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Apply stock filter at database level using Prisma raw query or computed logic
    // Note: Prisma doesn't support computed fields in where, so we'll filter after
    // but we'll optimize by only fetching what we need

    // Get packaging cost from settings (for net margin calculation)
    const packagingSetting = await prisma.setting.findFirst({
      where: { key: 'packagingCostTotal', organizationId: userProfile.organizationId },
    });
    const packagingCost = packagingSetting ? parseFloat(packagingSetting.value) : 8.00;

    // Fetch products with optimized select (only needed fields)
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          purchasePriceEur: true,
          purchasePriceMad: true,
          sellingPriceDh: true,
          promoPriceDh: true,
          quantityReceived: true,
          quantitySold: true,
          reorderLevel: true,
          purchaseSource: true,
          arrivageId: true,
          categoryId: true,
          brandId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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
          arrivage: {
            select: {
              id: true,
              reference: true,
              exchangeRate: true,
              source: true,
              shipDate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate stock, margins, and enrich with calculations
    // Filter stock at application level (Prisma doesn't support computed fields in where)
    const productsWithCalculations = products
      .map((product) => {
        const currentStock = calculateCurrentStock(
          product.quantityReceived,
          product.quantitySold
        );

        // Apply stock filter BEFORE calculating margin (early exit)
        if (stockFilter === 'out' && currentStock > 0) return null;
        if (stockFilter === 'low' && (currentStock === 0 || currentStock > product.reorderLevel)) return null;
        if (stockFilter === 'ok' && (currentStock === 0 || currentStock <= product.reorderLevel)) return null;

        // Calculate margin using regular selling price and MAD purchase price
        const margin = calculateMargin(product.sellingPriceDh, product.purchasePriceMad);
        
        // Calculate net margin (includes packaging costs)
        const netMargin = calculateNetMargin(product.sellingPriceDh, product.purchasePriceMad, packagingCost);

        // Get exchange rate from arrivage or use default (10.85)
        const exchangeRate = product.arrivage?.exchangeRate 
          ? product.arrivage.exchangeRate.toNumber() 
          : 10.85;

        return {
          id: product.id,
          name: product.name,
          brand: product.brand?.name || null,
          brandId: product.brandId,
          category: product.category.name,
          categoryId: product.categoryId,
          purchaseSource: product.purchaseSource,
          purchasePriceEur: product.purchasePriceEur?.toNumber() || null,
          purchasePriceMad: product.purchasePriceMad.toNumber(),
          sellingPriceDh: product.sellingPriceDh.toNumber(),
          promoPriceDh: product.promoPriceDh?.toNumber() || null,
          quantityReceived: product.quantityReceived,
          quantitySold: product.quantitySold,
          currentStock,
          reorderLevel: product.reorderLevel,
          margin,
          netMargin,
          exchangeRate,
          arrivageId: product.arrivageId,
          arrivageReference: product.arrivage?.reference,
          isActive: product.isActive,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null); // Remove nulls from stock filtering

    // Adjust total count if stock filter was applied
    const filteredTotal = stockFilter ? productsWithCalculations.length : total;

    return NextResponse.json({
      products: productsWithCalculations,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'UNKNOWN',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    if (!hasPermission(userProfile.role, 'PRODUCTS_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      brandId,
      categoryId,
      purchaseSource,
      purchasePriceEur,
      purchasePriceMad,
      sellingPriceDh,
      promoPriceDh,
      quantityReceived,
      reorderLevel,
      arrivageId,
    } = body;

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.organizationId !== userProfile.organizationId) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // Verify arrivage exists if provided
    if (arrivageId) {
      const arrivage = await prisma.arrivage.findUnique({
        where: { id: arrivageId },
      });
      if (!arrivage || arrivage.organizationId !== userProfile.organizationId) {
        return NextResponse.json({ error: 'Arrivage not found' }, { status: 400 });
      }
    }

    // Get exchange rate if arrivage is provided
    let exchangeRate = 10.85; // Default
    if (arrivageId) {
      const arrivage = await prisma.arrivage.findUnique({
        where: { id: arrivageId },
      });
      if (arrivage && arrivage.organizationId === userProfile.organizationId) {
        exchangeRate = arrivage.exchangeRate.toNumber();
      }
    }

    // Calculate MAD from EUR if EUR is provided but MAD is not
    let finalPurchasePriceMad = purchasePriceMad;
    if (purchasePriceEur && purchasePriceEur > 0 && !purchasePriceMad) {
      finalPurchasePriceMad = purchasePriceEur * exchangeRate;
    } else if (!purchasePriceMad && purchasePriceEur) {
      finalPurchasePriceMad = purchasePriceEur * exchangeRate;
    }

    // Verify brand exists if provided
    if (brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
      });
      if (!brand || brand.organizationId !== userProfile.organizationId) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 400 });
      }
    }

    // Create product (NO SKU - name is the identifier)
    const product = await prisma.product.create({
      data: {
        name,
        brandId: brandId || null,
        categoryId,
        purchaseSource: purchaseSource || 'OTHER',
        purchasePriceEur: purchasePriceEur || null,
        purchasePriceMad: finalPurchasePriceMad,
        sellingPriceDh,
        promoPriceDh: promoPriceDh || null,
        quantityReceived: quantityReceived || 0,
        quantitySold: 0,
        reorderLevel: reorderLevel || 3, // Default to 3 per optimization plan
        arrivageId: arrivageId || null,
        organizationId: userProfile.organizationId,
      },
      include: {
        category: true,
        brand: true,
        arrivage: true,
      },
    });

    if (arrivageId) {
      await recalcArrivageTotals(arrivageId, userProfile.organizationId);
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Product with this name already exists in this arrivage' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
