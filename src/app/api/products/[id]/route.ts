import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!hasPermission(userProfile.role, 'PRODUCTS_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        arrivage: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!hasPermission(userProfile.role, 'PRODUCTS_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    // Get current product to access arrivage exchange rate
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      include: { arrivage: true },
    });

    let exchangeRate = 10.85; // Default
    if (currentProduct?.arrivage) {
      exchangeRate = currentProduct.arrivage.exchangeRate.toNumber();
    }

    // Only update provided fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.purchaseSource !== undefined) updateData.purchaseSource = body.purchaseSource;
    if (body.purchasePriceEur !== undefined) {
      updateData.purchasePriceEur = body.purchasePriceEur;
      // Auto-calculate MAD if EUR is updated
      if (body.purchasePriceEur && body.purchasePriceEur > 0) {
        updateData.purchasePriceMad = body.purchasePriceEur * exchangeRate;
      }
    }
    if (body.purchasePriceMad !== undefined) updateData.purchasePriceMad = body.purchasePriceMad;
    if (body.sellingPriceDh !== undefined) updateData.sellingPriceDh = body.sellingPriceDh;
    if (body.promoPriceDh !== undefined) updateData.promoPriceDh = body.promoPriceDh;
    if (body.quantityReceived !== undefined) updateData.quantityReceived = body.quantityReceived;
    if (body.quantitySold !== undefined) updateData.quantitySold = body.quantitySold;
    if (body.reorderLevel !== undefined) updateData.reorderLevel = body.reorderLevel;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        arrivage: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!hasPermission(userProfile.role, 'PRODUCTS_DELETE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
