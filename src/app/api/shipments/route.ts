import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { calculateShipmentTotalEUR, calculateShipmentTotalDH } from '@/lib/calculations';

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

    if (!hasPermission(userProfile.role, 'SHIPMENTS_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shipments = await prisma.shipment.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals and summary for each shipment
    const shipmentsWithSummary = shipments.map((shipment) => {
      // Calculate items total cost
      const itemsCostEUR = shipment.items.reduce(
        (sum, item) => sum + item.quantity * item.costPerUnitEUR,
        0
      );

      // Calculate total cost EUR
      const totalCostEUR = calculateShipmentTotalEUR(
        shipment.shippingCostEUR,
        shipment.customsCostEUR,
        shipment.packagingCostEUR,
        itemsCostEUR
      );

      // Calculate total cost DH
      const totalCostDH = calculateShipmentTotalDH(totalCostEUR, shipment.exchangeRate);

      // Calculate revenue (from sales of products in this shipment)
      // This will be calculated from sales that reference shipment items
      const totalRevenueEUR = 0; // TODO: Calculate from sales
      const totalRevenueDH = totalRevenueEUR * shipment.exchangeRate;

      // Calculate profit
      const profitEUR = totalRevenueEUR - totalCostEUR;
      const profitDH = totalRevenueDH - totalCostDH;

      // Calculate margin percentage
      const marginPercent = totalCostEUR > 0 ? ((profitEUR / totalCostEUR) * 100) : 0;

      return {
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
      };
    });

    return NextResponse.json(shipmentsWithSummary);
  } catch (error) {
    console.error('Error fetching shipments:', error);
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

    if (!hasPermission(userProfile.role, 'SHIPMENTS_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      reference,
      supplierId,
      arrivalDate,
      status,
      exchangeRate,
      shippingCostEUR,
      customsCostEUR,
      packagingCostEUR,
    } = body;

    // Check if reference already exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { reference },
    });

    if (existingShipment) {
      return NextResponse.json(
        { error: 'Shipment with this reference already exists' },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 400 });
    }

    // Create shipment with calculated totals (initially 0 for items)
    const itemsCostEUR = 0;
    const totalCostEUR = calculateShipmentTotalEUR(
      shippingCostEUR || 0,
      customsCostEUR || 0,
      packagingCostEUR || 0,
      itemsCostEUR
    );
    const totalCostDH = calculateShipmentTotalDH(totalCostEUR, exchangeRate);

    const shipment = await prisma.shipment.create({
      data: {
        reference,
        supplierId,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        status: status || 'PENDING',
        exchangeRate,
        shippingCostEUR: shippingCostEUR || 0,
        customsCostEUR: customsCostEUR || 0,
        packagingCostEUR: packagingCostEUR || 0,
        totalCostEUR,
        totalCostDH,
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
