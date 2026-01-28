import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * DELETE /api/shipments/[id]/items/[itemId]
 * Unlinks a product from an arrivage (shipment)
 * 
 * Note: In the current schema, products are linked to arrivages via the Product.arrivageId field.
 * This endpoint sets arrivageId to null to unlink the product.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: arrivageId, itemId: productId } = await params;
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

    if (!hasPermission(userProfile.role, 'ARRIVAGES_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the product exists and belongs to this arrivage
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.arrivageId !== arrivageId) {
      return NextResponse.json(
        { error: 'Product does not belong to this arrivage' },
        { status: 400 }
      );
    }

    // Unlink product from arrivage
    await prisma.product.update({
      where: { id: productId },
      data: {
        arrivageId: null,
      },
    });

    // Update arrivage product count
    const productCount = await prisma.product.count({
      where: { arrivageId },
    });

    const totalUnits = await prisma.product.aggregate({
      where: { arrivageId },
      _sum: {
        quantityReceived: true,
      },
    });

    await prisma.arrivage.update({
      where: { id: arrivageId },
      data: {
        productCount,
        totalUnits: totalUnits._sum.quantityReceived || 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking product from arrivage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipments/[id]/items/[itemId]
 * Get a specific product in an arrivage
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: arrivageId, itemId: productId } = await params;
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

    if (!hasPermission(userProfile.role, 'ARRIVAGES_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        brand: true,
        arrivage: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.arrivageId !== arrivageId) {
      return NextResponse.json(
        { error: 'Product does not belong to this arrivage' },
        { status: 400 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/shipments/[id]/items/[itemId]
 * Update a product's stock quantities within an arrivage
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: arrivageId, itemId: productId } = await params;
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

    if (!hasPermission(userProfile.role, 'ARRIVAGES_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!hasPermission(userProfile.role, 'STOCK_ADJUST')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { quantityReceived } = body;
    if (quantityReceived !== undefined && (!Number.isInteger(quantityReceived) || quantityReceived < 0)) {
      return NextResponse.json(
        { error: 'quantityReceived must be a non-negative integer' },
        { status: 400 }
      );
    }

    // Verify the product exists and belongs to this arrivage
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.arrivageId !== arrivageId) {
      return NextResponse.json(
        { error: 'Product does not belong to this arrivage' },
        { status: 400 }
      );
    }

    const nextQuantityReceived =
      quantityReceived !== undefined ? quantityReceived : product.quantityReceived;
    const delta = nextQuantityReceived - product.quantityReceived;
    const currentStock = product.quantityReceived - product.quantitySold;
    const newStock = currentStock + delta;

    if (newStock < 0) {
      return NextResponse.json(
        { error: 'Cannot reduce quantityReceived below quantitySold' },
        { status: 400 }
      );
    }

    // Update product quantity and create stock movement in a transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          quantityReceived: nextQuantityReceived,
        },
        include: {
          category: true,
          brand: true,
          arrivage: true,
        },
      });

      if (delta !== 0) {
        await tx.stockMovement.create({
          data: {
            productId,
            type: 'ADJUSTMENT',
            quantity: delta,
            previousQty: currentStock,
            newQty: newStock,
            reference: `Shipment ${arrivageId} item update`,
            userId: user.id,
            notes: 'Quantity received adjusted via shipment item update',
          },
        });
      }

      return updated;
    });

    // Update arrivage total units
    const totalUnits = await prisma.product.aggregate({
      where: { arrivageId },
      _sum: {
        quantityReceived: true,
      },
    });

    await prisma.arrivage.update({
      where: { id: arrivageId },
      data: {
        totalUnits: totalUnits._sum.quantityReceived || 0,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product in arrivage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
