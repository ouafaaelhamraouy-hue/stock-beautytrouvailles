import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * Get stock movements for a product
 * Returns all stock movements (sales, adjustments, arrivages, etc.) with user info
 */
export async function GET(
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

    // Check permission
    if (!hasPermission(userProfile.role, 'STOCK_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get all stock movements for this product
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        currentStock: product.quantityReceived - product.quantitySold,
      },
      movements: movements.map((m) => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        previousQty: m.previousQty,
        newQty: m.newQty,
        reference: m.reference,
        notes: m.notes,
        createdAt: m.createdAt,
        user: m.user ? {
          email: m.user.email,
          fullName: m.user.fullName,
        } : null,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching stock movements:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
