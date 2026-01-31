import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hasPermission } from '@/lib/permissions';
import { calculateSaleTotal } from '@/lib/calculations';
import { saleSchema } from '@/lib/validations';

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

    if (!hasPermission(userProfile.role, 'SALES_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isPromo = searchParams.get('isPromo');

    // Build where clause
    const where: Prisma.SaleWhereInput = {};
    if (productId) {
      where.productId = productId;
    }
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.saleDate.lte = new Date(endDate);
      }
    }
    if (isPromo !== null && isPromo !== undefined) {
      where.isPromo = isPromo === 'true';
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
    });

    const toNumber = (value: unknown) =>
      typeof value === 'number'
        ? value
        : typeof (value as { toNumber?: () => number })?.toNumber === 'function'
          ? (value as { toNumber: () => number }).toNumber()
          : Number(value) || 0;

    const normalized = sales.map((sale) => ({
      ...sale,
      pricePerUnit: sale.pricePerUnit !== null ? toNumber(sale.pricePerUnit) : null,
      totalAmount: toNumber(sale.totalAmount),
      bundlePriceTotal: sale.bundlePriceTotal !== null ? toNumber(sale.bundlePriceTotal) : null,
      items: sale.items?.map((item) => ({
        ...item,
        pricePerUnit: toNumber(item.pricePerUnit),
      })),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    if (!hasPermission(userProfile.role, 'SALES_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body using saleSchema
    const validationResult = saleSchema.safeParse({
      ...body,
      saleDate: body.saleDate ? new Date(body.saleDate) : new Date(),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      productId,
      quantity,
      pricePerUnit,
      pricingMode = 'REGULAR',
      bundlePriceTotal,
      items,
      isPromo = false,
      saleDate,
      notes,
    } = validationResult.data;

    const aggregateItems = (bundleItems: NonNullable<typeof items>) => {
      const map = new Map<string, { productId: string; quantity: number; pricePerUnit: number }>();
      for (const item of bundleItems) {
        const existing = map.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.pricePerUnit = item.pricePerUnit;
        } else {
          map.set(item.productId, { ...item });
        }
      }
      return Array.from(map.values());
    };

    if (pricingMode !== 'BUNDLE') {
      if (!productId) {
        return NextResponse.json({ error: 'Product is required' }, { status: 400 });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          arrivage: {
            select: {
              reference: true,
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const availableStock = product.quantityReceived - product.quantitySold;
      if (!quantity || quantity > availableStock) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity || 0}` },
          { status: 409 }
        );
      }

      if (typeof pricePerUnit !== 'number') {
        return NextResponse.json(
          { error: 'Price per unit is required' },
          { status: 400 }
        );
      }

      const purchasePriceMad = product.purchasePriceMad ? Number(product.purchasePriceMad) : 0;
      if (purchasePriceMad > 0 && pricePerUnit < purchasePriceMad) {
        if (!notes || notes.trim().length === 0) {
          return NextResponse.json(
            { error: 'Notes are required when selling below cost price' },
            { status: 400 }
          );
        }
      }

      const totalAmount = calculateSaleTotal(quantity, pricePerUnit);
      const expectedTotal = quantity * pricePerUnit;
      if (Math.abs(totalAmount - expectedTotal) > 0.01) {
        return NextResponse.json(
          { error: 'Total amount mismatch. Expected: ' + expectedTotal + ', Got: ' + totalAmount },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            productId,
            quantity,
            pricePerUnit,
            totalAmount,
            pricingMode,
            bundlePriceTotal: null,
            isPromo: pricingMode === 'PROMO' ? true : isPromo,
            saleDate: saleDate || new Date(),
            notes: notes || null,
          },
          include: {
            product: {
              include: {
                category: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        const previousQtySold = product.quantitySold;
        const newQtySold = previousQtySold + quantity;

        await tx.product.update({
          where: { id: productId },
          data: {
            quantitySold: newQtySold,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId,
            type: 'SALE',
            quantity: -quantity,
            previousQty: product.quantityReceived - previousQtySold,
            newQty: product.quantityReceived - newQtySold,
            reference: `Sale ${sale.id}`,
            userId: user.id,
          },
        });

        return sale;
      });

      return NextResponse.json(result, { status: 201 });
    }

    const bundleItems = items ? aggregateItems(items) : [];
    if (bundleItems.length < 2) {
      return NextResponse.json(
        { error: 'At least two items are required for a bundle' },
        { status: 400 }
      );
    }

    const productIds = bundleItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 404 });
    }

    for (const item of bundleItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const availableStock = product.quantityReceived - product.quantitySold;
      if (item.quantity > availableStock) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}` },
          { status: 409 }
        );
      }
    }

    for (const item of bundleItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const purchasePriceMad = product.purchasePriceMad ? Number(product.purchasePriceMad) : 0;
      if (purchasePriceMad > 0 && item.pricePerUnit < purchasePriceMad) {
        if (!notes || notes.trim().length === 0) {
          return NextResponse.json(
            { error: 'Notes are required when selling below cost price' },
            { status: 400 }
          );
        }
      }
    }

    const totalAmount = bundleItems.reduce(
      (sum, item) => sum + item.quantity * item.pricePerUnit,
      0
    );

    if (typeof bundlePriceTotal === 'number' && Math.abs(bundlePriceTotal - totalAmount) > 0.01) {
      return NextResponse.json(
        { error: 'Bundle total mismatch. Expected: ' + totalAmount + ', Got: ' + bundlePriceTotal },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          productId: null,
          quantity: null,
          pricePerUnit: null,
          totalAmount,
          pricingMode: 'BUNDLE',
          bundlePriceTotal: totalAmount,
          isPromo: true,
          saleDate: saleDate || new Date(),
          notes: notes || null,
          items: {
            create: bundleItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      for (const item of bundleItems) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const previousQtySold = product.quantitySold;
        const newQtySold = previousQtySold + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { quantitySold: newQtySold },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            previousQty: product.quantityReceived - previousQtySold,
            newQty: product.quantityReceived - newQtySold,
            reference: `Sale ${sale.id} (bundle)`,
            userId: user.id,
          },
        });
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating sale:', error);
    
    // Don't leak internal errors in production
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
