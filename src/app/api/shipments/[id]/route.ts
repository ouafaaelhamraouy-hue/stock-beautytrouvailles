import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { calculateShipmentTotalEUR, calculateShipmentTotalDH } from '@/lib/calculations';

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

    if (!hasPermission(userProfile.role, 'SHIPMENTS_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Calculate totals and summary
    const itemsCostEUR = shipment.items.reduce(
      (sum, item) => sum + item.quantity * item.costPerUnitEUR,
      0
    );

    const totalCostEUR = calculateShipmentTotalEUR(
      shipment.shippingCostEUR,
      shipment.customsCostEUR,
      shipment.packagingCostEUR,
      itemsCostEUR
    );

    const totalCostDH = calculateShipmentTotalDH(totalCostEUR, shipment.exchangeRate);

    // Calculate revenue from sales (TODO: implement when sales are linked to shipment items)
    const totalRevenueEUR = 0;
    const totalRevenueDH = totalRevenueEUR * shipment.exchangeRate;

    const profitEUR = totalRevenueEUR - totalCostEUR;
    const profitDH = totalRevenueDH - totalCostDH;
    const marginPercent = totalCostEUR > 0 ? ((profitEUR / totalCostEUR) * 100) : 0;

    return NextResponse.json({
      ...shipment,
      calculatedTotals: {
        itemsCostEUR,
        totalCostEUR,
        totalCostDH,
        totalRevenueEUR,
        totalRevenueDH,
        profitEUR,
        profitDH,
        marginPercent,
      },
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
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

    if (!hasPermission(userProfile.role, 'SHIPMENTS_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const existingShipment = await prisma.shipment.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingShipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Calculate new totals if costs changed
    const shippingCostEUR = body.shippingCostEUR !== undefined ? body.shippingCostEUR : existingShipment.shippingCostEUR;
    const customsCostEUR = body.customsCostEUR !== undefined ? body.customsCostEUR : existingShipment.customsCostEUR;
    const packagingCostEUR = body.packagingCostEUR !== undefined ? body.packagingCostEUR : existingShipment.packagingCostEUR;
    const exchangeRate = body.exchangeRate !== undefined ? body.exchangeRate : existingShipment.exchangeRate;

    const itemsCostEUR = existingShipment.items.reduce(
      (sum, item) => sum + item.quantity * item.costPerUnitEUR,
      0
    );

    const totalCostEUR = calculateShipmentTotalEUR(
      shippingCostEUR,
      customsCostEUR,
      packagingCostEUR,
      itemsCostEUR
    );
    const totalCostDH = calculateShipmentTotalDH(totalCostEUR, exchangeRate);

    // Update shipment
    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        reference: body.reference || existingShipment.reference,
        supplierId: body.supplierId || existingShipment.supplierId,
        arrivalDate: body.arrivalDate !== undefined ? (body.arrivalDate ? new Date(body.arrivalDate) : null) : existingShipment.arrivalDate,
        status: body.status || existingShipment.status,
        exchangeRate,
        shippingCostEUR,
        customsCostEUR,
        packagingCostEUR,
        totalCostEUR,
        totalCostDH,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(shipment);
  } catch (error) {
    console.error('Error updating shipment:', error);
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

    if (!hasPermission(userProfile.role, 'SHIPMENTS_DELETE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Delete shipment (items will be cascade deleted)
    await prisma.shipment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
