import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/permissions';
import { z } from 'zod';

const resetStockSchema = z.object({
  newStock: z.number().int().min(0),
  resetSold: z.boolean().optional().default(true),
  reason: z.string().min(1, 'Reason is required').max(200),
  notes: z.string().max(500).optional().nullable(),
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

    if (!isSuperAdmin(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = resetStockSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { newStock, resetSold, reason, notes } = validationResult.data;

    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId: userProfile.organizationId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentStock = product.quantityReceived - product.quantitySold;
    const quantitySold = resetSold ? 0 : product.quantitySold;
    const quantityReceived = resetSold
      ? newStock
      : newStock + product.quantitySold;

    if (quantityReceived < 0 || quantitySold < 0) {
      return NextResponse.json({ error: 'Invalid stock values' }, { status: 400 });
    }

    const delta = newStock - currentStock;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          quantityReceived,
          quantitySold,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          organizationId: userProfile.organizationId,
          type: 'ADJUSTMENT',
          quantity: delta,
          previousQty: currentStock,
          newQty: newStock,
          reference: 'Stock Reset',
          notes: notes || reason,
          userId: user.id,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      product: {
        id: result.id,
        currentStock: result.quantityReceived - result.quantitySold,
        quantityReceived: result.quantityReceived,
        quantitySold: result.quantitySold,
      },
    });
  } catch (error: unknown) {
    console.error('Error resetting stock:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
