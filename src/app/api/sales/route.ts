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
      },
      orderBy: {
        saleDate: 'desc',
      },
    });

    return NextResponse.json(sales);
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

    const { productId, quantity, pricePerUnit, isPromo = false, saleDate, notes } = validationResult.data;

    // Fetch product with category and optional arrivage for display
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

    // Calculate available stock: quantityReceived - quantitySold
    const availableStock = product.quantityReceived - product.quantitySold;

    // Guardrail: Check if enough stock is available
    if (quantity > availableStock) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}` },
        { status: 409 }
      );
    }

    // Rule: Custom deals - if price is below cost, notes are required
    const purchasePriceMad = product.purchasePriceMad ? Number(product.purchasePriceMad) : 0;
    if (purchasePriceMad > 0 && pricePerUnit < purchasePriceMad) {
      if (!notes || notes.trim().length === 0) {
        return NextResponse.json(
          { error: 'Notes are required when selling below cost price' },
          { status: 400 }
        );
      }
    }

    // Calculate total amount (must equal quantity * pricePerUnit) - do not trust client
    const totalAmount = calculateSaleTotal(quantity, pricePerUnit);
    const expectedTotal = quantity * pricePerUnit;
    
    if (Math.abs(totalAmount - expectedTotal) > 0.01) {
      return NextResponse.json(
        { error: 'Total amount mismatch. Expected: ' + expectedTotal + ', Got: ' + totalAmount },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          productId,
          quantity,
          pricePerUnit,
          totalAmount,
          isPromo,
          saleDate: saleDate || new Date(),
          notes: notes || null,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });

      // Update product: increment quantitySold
      const previousQtySold = product.quantitySold;
      const newQtySold = previousQtySold + quantity;

      await tx.product.update({
        where: { id: productId },
        data: {
          quantitySold: newQtySold,
        },
      });

      // Create StockMovement entry
      await tx.stockMovement.create({
        data: {
          productId,
          type: 'SALE',
          quantity: -quantity, // Negative for outbound
          previousQty: product.quantityReceived - previousQtySold,
          newQty: product.quantityReceived - newQtySold,
          reference: `Sale ${sale.id}`,
          userId: user.id,
        },
      });

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
