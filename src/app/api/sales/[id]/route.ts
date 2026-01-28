import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { calculateSaleTotal } from '@/lib/calculations';
import { saleSchema } from '@/lib/validations';
import { z } from 'zod';

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

    if (!hasPermission(userProfile.role, 'SALES_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    if (!hasPermission(userProfile.role, 'SALES_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      quantity: z.number().int().min(1).optional(),
      pricePerUnit: z.number().min(0).optional(),
      isPromo: z.boolean().optional(),
      saleDate: z.string().datetime().optional(),
      notes: z.string().max(500).optional().nullable(),
    });
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const { quantity, pricePerUnit, isPromo, saleDate, notes } = parsed.data;

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // If quantity changes, we need to adjust stock
    const quantityDiff = quantity !== undefined ? quantity - existingSale.quantity : 0;

    if (quantityDiff !== 0) {
      const product = await prisma.product.findUnique({
        where: { id: existingSale.productId },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Calculate available stock
      const availableStock = product.quantityReceived - product.quantitySold;

      // If increasing quantity, check if enough stock is available
      if (quantityDiff > 0 && quantityDiff > availableStock) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${availableStock}, Additional needed: ${quantityDiff}` },
          { status: 409 }
        );
      }
    }

    // Calculate new total amount
    const finalQuantity = quantity !== undefined ? quantity : existingSale.quantity;
    const finalPricePerUnit = pricePerUnit !== undefined ? pricePerUnit : existingSale.pricePerUnit;
    const finalNotes = notes !== undefined ? notes : existingSale.notes;
    const purchasePriceMad = existingSale.product.purchasePriceMad
      ? Number(existingSale.product.purchasePriceMad)
      : 0;

    // Rule: notes required when selling below cost
    if (purchasePriceMad > 0 && finalPricePerUnit < purchasePriceMad) {
      if (!finalNotes || finalNotes.trim().length === 0) {
        return NextResponse.json(
          { error: 'Notes are required when selling below cost price' },
          { status: 400 }
        );
      }
    }

    // Validate against saleSchema for consistency
    const validationResult = saleSchema.safeParse({
      productId: existingSale.productId,
      quantity: finalQuantity,
      pricePerUnit: finalPricePerUnit,
      isPromo: isPromo !== undefined ? isPromo : existingSale.isPromo,
      saleDate: saleDate ? new Date(saleDate) : existingSale.saleDate,
      notes: finalNotes,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    const totalAmount = calculateSaleTotal(finalQuantity, finalPricePerUnit);

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update product quantitySold if quantity changed
      if (quantityDiff !== 0) {
        await tx.product.update({
          where: { id: existingSale.productId },
          data: {
            quantitySold: { increment: quantityDiff },
          },
        });

        // Create StockMovement entry
        const product = await tx.product.findUnique({
          where: { id: existingSale.productId },
        });

        if (product) {
          await tx.stockMovement.create({
            data: {
              productId: existingSale.productId,
              type: 'SALE',
              quantity: -quantityDiff, // Negative for outbound
              previousQty: product.quantityReceived - (product.quantitySold - quantityDiff),
              newQty: product.quantityReceived - product.quantitySold,
              reference: `Sale ${id} (updated)`,
              userId: user.id,
            },
          });
        }
      }

      // Update sale
      const sale = await tx.sale.update({
        where: { id },
        data: {
          quantity: finalQuantity,
          pricePerUnit: finalPricePerUnit,
          totalAmount,
          isPromo: isPromo !== undefined ? isPromo : existingSale.isPromo,
          saleDate: saleDate ? new Date(saleDate) : existingSale.saleDate,
          notes: finalNotes,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });

      return sale;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error updating sale:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
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

    if (!hasPermission(userProfile.role, 'SALES_DELETE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Use transaction to restore stock and delete sale
    await prisma.$transaction(async (tx) => {
      // Restore stock: decrement quantitySold
      await tx.product.update({
        where: { id: sale.productId },
        data: {
          quantitySold: { decrement: sale.quantity },
        },
      });

      // Create StockMovement entry for restoration
      const product = await tx.product.findUnique({
        where: { id: sale.productId },
      });

      if (product) {
        await tx.stockMovement.create({
          data: {
            productId: sale.productId,
            type: 'RETURN', // Sale deletion is treated as return
            quantity: sale.quantity, // Positive for inbound
            previousQty: product.quantityReceived - (product.quantitySold + sale.quantity),
            newQty: product.quantityReceived - product.quantitySold,
            reference: `Sale ${id} (deleted)`,
            userId: user.id,
          },
        });
      }

      // Delete sale
      await tx.sale.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting sale:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
