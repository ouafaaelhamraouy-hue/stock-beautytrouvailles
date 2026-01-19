import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { calculateSaleTotal } from '@/lib/calculations';

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
    const { quantity, pricePerUnit, isPromo, saleDate } = body;

    const existingSale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // If quantity changes, we need to adjust stock
    // For simplicity, we'll revert the old sale and create a new one
    // This ensures stock integrity
    if (quantity !== existingSale.quantity) {
      // Revert old sale stock
      const product = await prisma.product.findUnique({
        where: { id: existingSale.productId },
        include: {
          shipmentItems: {
            select: {
              id: true,
              quantityRemaining: true,
              quantitySold: true,
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Check if enough stock is available for the new quantity
      const totalAvailableStock = product.shipmentItems.reduce(
        (sum, item) => sum + item.quantityRemaining,
        0
      );
      const additionalNeeded = quantity - existingSale.quantity;

      if (additionalNeeded > totalAvailableStock) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${totalAvailableStock}, Additional needed: ${additionalNeeded}` },
          { status: 400 }
        );
      }

      // Revert old sale (restore stock)
      // This is simplified - in a real scenario, you'd track which shipment items were affected
      // For now, we'll distribute the reversion
      const sortedItems = [...product.shipmentItems].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      let remainingToRestore = existingSale.quantity;
      const itemsToRestore: Array<{ id: string; quantity: number }> = [];

      for (const item of sortedItems) {
        if (remainingToRestore <= 0) break;
        const canRestore = Math.min(remainingToRestore, existingSale.quantity);
        itemsToRestore.push({
          id: item.id,
          quantity: canRestore,
        });
        remainingToRestore -= canRestore;
      }

      await prisma.$transaction([
        // Restore old stock
        ...itemsToRestore.map(({ id, quantity: qty }) =>
          prisma.shipmentItem.update({
            where: { id },
            data: {
              quantitySold: { decrement: qty },
              quantityRemaining: { increment: qty },
            },
          })
        ),
      ]);
    }

    // Calculate new total amount
    const totalAmount = calculateSaleTotal(
      quantity || existingSale.quantity,
      pricePerUnit !== undefined ? pricePerUnit : existingSale.pricePerUnit
    );

    // Update sale
    const sale = await prisma.sale.update({
      where: { id },
      data: {
        quantity: quantity !== undefined ? quantity : existingSale.quantity,
        pricePerUnit: pricePerUnit !== undefined ? pricePerUnit : existingSale.pricePerUnit,
        totalAmount,
        isPromo: isPromo !== undefined ? isPromo : existingSale.isPromo,
        saleDate: saleDate ? new Date(saleDate) : existingSale.saleDate,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // If quantity changed, update stock for new quantity
    if (quantity !== existingSale.quantity) {
      const product = await prisma.product.findUnique({
        where: { id: existingSale.productId },
        include: {
          shipmentItems: {
            select: {
              id: true,
              quantityRemaining: true,
            },
          },
        },
      });

      if (product) {
        const quantityDiff = quantity - existingSale.quantity;
        const sortedItems = [...product.shipmentItems].sort(
          (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

        let remainingToDeduct = Math.abs(quantityDiff);
        const itemsToUpdate: Array<{ id: string; quantity: number }> = [];

        for (const item of sortedItems) {
          if (remainingToDeduct <= 0) break;
          if (item.quantityRemaining > 0) {
            const toDeduct = Math.min(remainingToDeduct, item.quantityRemaining);
            itemsToUpdate.push({
              id: item.id,
              quantity: quantityDiff > 0 ? toDeduct : -toDeduct,
            });
            remainingToDeduct -= toDeduct;
          }
        }

        await prisma.$transaction(
          itemsToUpdate.map(({ id, quantity: qty }) =>
            prisma.shipmentItem.update({
              where: { id },
              data: {
                quantitySold: { increment: qty },
                quantityRemaining: { decrement: qty },
              },
            })
          )
        );
      }
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error updating sale:', error);
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

    if (!hasPermission(userProfile.role, 'SALES_DELETE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Restore stock when sale is deleted
    const product = await prisma.product.findUnique({
      where: { id: sale.productId },
      include: {
        shipmentItems: {
          select: {
            id: true,
            quantityRemaining: true,
            quantitySold: true,
          },
        },
      },
    });

    if (product) {
      // Distribute stock restoration (simplified - restore to most recent items)
      const sortedItems = [...product.shipmentItems].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      let remainingToRestore = sale.quantity;
      const itemsToRestore: Array<{ id: string; quantity: number }> = [];

      for (const item of sortedItems) {
        if (remainingToRestore <= 0) break;
        if (item.quantitySold > 0) {
          const canRestore = Math.min(remainingToRestore, sale.quantity);
          itemsToRestore.push({
            id: item.id,
            quantity: canRestore,
          });
          remainingToRestore -= canRestore;
        }
      }

      await prisma.$transaction([
        // Restore stock
        ...itemsToRestore.map(({ id, quantity: qty }) =>
          prisma.shipmentItem.update({
            where: { id },
            data: {
              quantitySold: { decrement: qty },
              quantityRemaining: { increment: qty },
            },
          })
        ),
        // Delete sale
        prisma.sale.delete({
          where: { id },
        }),
      ]);
    } else {
      // Delete sale even if product not found
      await prisma.sale.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
