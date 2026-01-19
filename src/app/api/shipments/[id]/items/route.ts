import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { calculateShipmentTotalEUR, calculateShipmentTotalDH } from '@/lib/calculations';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shipmentId } = await params;
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

    if (!hasPermission(userProfile.role, 'SHIPMENTS_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, quantity, costPerUnitEUR } = body;

    // Verify shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { items: true },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if item already exists
    const existingItem = await prisma.shipmentItem.findUnique({
      where: {
        shipmentId_productId: {
          shipmentId,
          productId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'This product is already in the shipment. Update the existing item instead.' },
        { status: 400 }
      );
    }

    // Calculate cost in DH
    const costPerUnitDH = costPerUnitEUR * shipment.exchangeRate;

    // Create shipment item
    const item = await prisma.shipmentItem.create({
      data: {
        shipmentId,
        productId,
        quantity,
        costPerUnitEUR,
        costPerUnitDH,
        quantityRemaining: quantity, // Initially, all quantity is remaining
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Recalculate shipment totals
    const itemsCostEUR = shipment.items.reduce(
      (sum, i) => sum + i.quantity * i.costPerUnitEUR,
      0
    ) + (quantity * costPerUnitEUR);

    const totalCostEUR = calculateShipmentTotalEUR(
      shipment.shippingCostEUR,
      shipment.customsCostEUR,
      shipment.packagingCostEUR,
      itemsCostEUR
    );
    const totalCostDH = calculateShipmentTotalDH(totalCostEUR, shipment.exchangeRate);

    // Update shipment totals
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        totalCostEUR,
        totalCostDH,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
