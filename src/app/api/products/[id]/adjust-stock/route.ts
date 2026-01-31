import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const adjustStockSchema = z.object({
  delta: z.number().int().refine((val) => val !== 0, {
    message: 'Delta must be non-zero',
  }),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason must be less than 200 characters'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
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

    // Check permission
    if (!hasPermission(userProfile.role, 'STOCK_ADJUST')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = adjustStockSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { delta, reason, notes } = validationResult.data;

    // Fetch product
    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId: userProfile.organizationId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate new stock
    const currentStock = product.quantityReceived - product.quantitySold;
    const newStock = currentStock + delta;

    // Rule: Never allow stock to go below zero
    if (newStock < 0) {
      return NextResponse.json(
        { 
          error: `Cannot adjust stock below zero. Current stock: ${currentStock}, Delta: ${delta}` 
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Calculate new quantitySold (if delta is negative, we're reducing stock)
      // If delta is positive, we're adding stock (increasing quantityReceived)
      // For simplicity, we'll adjust quantitySold for negative deltas
      // and quantityReceived for positive deltas
      
      let updatedProduct;
      if (delta < 0) {
        // Reducing stock: adjust received (does NOT count as sold)
        updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            quantityReceived: { decrement: Math.abs(delta) },
          },
        });
      } else {
        // Adding stock: increase quantityReceived
        updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            quantityReceived: { increment: delta },
          },
        });
      }

      // Create StockMovement entry
      await tx.stockMovement.create({
        data: {
          productId,
          organizationId: userProfile.organizationId,
          type: 'ADJUSTMENT',
          quantity: delta,
          previousQty: currentStock,
          newQty: newStock,
          reference: delta < 0 ? 'Stock Adjustment (decrease)' : 'Stock Adjustment (increase)',
          notes: notes || reason, // Use reason as notes if notes not provided
          userId: user.id,
        },
      });

      return updatedProduct;
    });

    return NextResponse.json({
      success: true,
      product: {
        id: result.id,
        currentStock: result.quantityReceived - result.quantitySold,
      },
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error adjusting stock:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
