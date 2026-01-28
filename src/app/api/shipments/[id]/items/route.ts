import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * POST /api/shipments/[id]/items
 * Links a product to an arrivage (shipment)
 * 
 * Note: In the current schema, products are linked to arrivages via the Product.arrivageId field.
 * This endpoint updates an existing product to link it to an arrivage.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: arrivageId } = await params;
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

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Verify arrivage exists
    const arrivage = await prisma.arrivage.findUnique({
      where: { id: arrivageId },
    });

    if (!arrivage) {
      return NextResponse.json({ error: 'Arrivage not found' }, { status: 404 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product is already linked to this arrivage
    if (product.arrivageId === arrivageId) {
      return NextResponse.json(
        { error: 'Product is already linked to this arrivage' },
        { status: 400 }
      );
    }

    // Link product to arrivage
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        arrivageId,
      },
      include: {
        category: true,
        brand: true,
        arrivage: true,
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

    return NextResponse.json(updatedProduct, { status: 201 });
  } catch (error) {
    console.error('Error linking product to arrivage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipments/[id]/items
 * Get all products linked to an arrivage
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: arrivageId } = await params;
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

    // Verify arrivage exists
    const arrivage = await prisma.arrivage.findUnique({
      where: { id: arrivageId },
    });

    if (!arrivage) {
      return NextResponse.json({ error: 'Arrivage not found' }, { status: 404 });
    }

    // Get all products linked to this arrivage
    const products = await prisma.product.findMany({
      where: { arrivageId },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching arrivage products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
