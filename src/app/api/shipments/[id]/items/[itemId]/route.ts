import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { calculateShipmentTotalEUR, calculateShipmentTotalDH } from '@/lib/calculations';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: shipmentId, itemId } = await params;
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
    const { quantity, costPerUnitEUR } = body;

    const existingItem = await prisma.shipmentItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem || existingItem.shipmentId !== shipmentId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { items: true },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Calculate new cost in DH
    const costPerUnitDH = costPerUnitEUR * shipment.exchangeRate;

    // Update item
    const item = await prisma.shipmentItem.update({
      where: { id: itemId },
      data: {
        quantity: quantity || existingItem.quantity,
        costPerUnitEUR: costPerUnitEUR !== undefined ? costPerUnitEUR : existingItem.costPerUnitEUR,
        costPerUnitDH: costPerUnitEUR !== undefined ? costPerUnitDH : existingItem.costPerUnitDH,
        quantityRemaining: quantity !== undefined ? quantity - existingItem.quantitySold : existingItem.quantityRemaining,
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
    const itemsCostEUR = shipment.items
      .filter((i) => i.id !== itemId)
      .reduce((sum, i) => sum + i.quantity * i.costPerUnitEUR, 0) +
      (item.quantity * item.costPerUnitEUR);

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

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating shipment item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: shipmentId, itemId } = await params;
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

    const item = await prisma.shipmentItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.shipmentId !== shipmentId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { items: true },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Delete item
    await prisma.shipmentItem.delete({
      where: { id: itemId },
    });

    // Recalculate shipment totals
    const itemsCostEUR = shipment.items
      .filter((i) => i.id !== itemId)
      .reduce((sum, i) => sum + i.quantity * i.costPerUnitEUR, 0);

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipment item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
