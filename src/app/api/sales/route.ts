import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { calculateSaleTotal } from '@/lib/calculations';

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
    const where: any = {};
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
    const { productId, quantity, pricePerUnit, isPromo = false, saleDate } = body;

    // Verify product exists and get shipment items with dates
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        shipmentItems: {
          select: {
            id: true,
            quantityRemaining: true,
            quantitySold: true,
            quantity: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate total available stock
    const totalAvailableStock = product.shipmentItems.reduce(
      (sum, item) => sum + item.quantityRemaining,
      0
    );

    // Check if enough stock is available
    if (quantity > totalAvailableStock) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${totalAvailableStock}, Requested: ${quantity}` },
        { status: 400 }
      );
    }

    // Calculate total amount (must equal quantity * pricePerUnit)
    const totalAmount = calculateSaleTotal(quantity, pricePerUnit);

    // Create sale
    const sale = await prisma.sale.create({
      data: {
        productId,
        quantity,
        pricePerUnit,
        totalAmount,
        isPromo,
        saleDate: saleDate ? new Date(saleDate) : new Date(),
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Update shipment items - reduce quantityRemaining and increase quantitySold
    // Distribute the sale across shipment items (FIFO - first in, first out)
    let remainingQuantity = quantity;
    const shipmentItemsToUpdate: Array<{ id: string; quantity: number }> = [];

    // Sort shipment items by creation date (oldest first) for FIFO
    const sortedItems = [...product.shipmentItems]
      .filter((item) => item.quantityRemaining > 0)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });

    for (const item of sortedItems) {
      if (remainingQuantity <= 0) break;

      const toDeduct = Math.min(remainingQuantity, item.quantityRemaining);
      shipmentItemsToUpdate.push({
        id: item.id,
        quantity: toDeduct,
      });
      remainingQuantity -= toDeduct;
    }

    // Update shipment items in a transaction
    if (shipmentItemsToUpdate.length > 0) {
      await prisma.$transaction(
        shipmentItemsToUpdate.map(({ id, quantity: qty }) =>
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

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
