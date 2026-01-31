import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    if (!hasPermission(userProfile.role, 'PRODUCTS_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = await prisma.product.findFirst({
      where: { id, organizationId: userProfile.organizationId },
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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    if (!hasPermission(userProfile.role, 'PRODUCTS_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Prisma.ProductUpdateInput = {};

    // Get current product to access arrivage exchange rate
    const currentProduct = await prisma.product.findFirst({
      where: { id, organizationId: userProfile.organizationId },
      include: { arrivage: true },
    });
    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let exchangeRate = 10.85; // Default
    if (currentProduct?.arrivage) {
      exchangeRate = currentProduct.arrivage.exchangeRate.toNumber();
    }

    // Check permission for editing purchase costs
    const isEditingCosts = body.purchasePriceEur !== undefined || body.purchasePriceMad !== undefined;
    if (isEditingCosts && !hasPermission(userProfile.role, 'PRODUCTS_EDIT_COSTS')) {
      return NextResponse.json(
        { error: 'You do not have permission to edit purchase costs' },
        { status: 403 }
      );
    }

    // Prevent direct stock mutations outside audited endpoints
    if (body.quantityReceived !== undefined || body.quantitySold !== undefined) {
      return NextResponse.json(
        { error: 'Direct stock edits are not allowed. Use /adjust-stock or shipment item adjustments.' },
        { status: 400 }
      );
    }

    // Validate category/brand if provided
    if (body.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });
      if (!category || category.organizationId !== userProfile.organizationId) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 });
      }
    }

    if (body.brandId !== undefined && body.brandId !== null) {
      const brand = await prisma.brand.findUnique({
        where: { id: body.brandId },
      });
      if (!brand || brand.organizationId !== userProfile.organizationId) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 400 });
      }
    }

    // Only update provided fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.brandId !== undefined) {
      updateData.brand = body.brandId
        ? { connect: { id: body.brandId } }
        : { disconnect: true };
    }
    if (body.categoryId !== undefined) {
      updateData.category = { connect: { id: body.categoryId } };
    }
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
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
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
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
