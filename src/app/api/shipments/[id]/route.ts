import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { recalcArrivageTotals } from '@/lib/arrivageTotals';

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

    if (!hasPermission(userProfile.role, 'ARRIVAGES_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await recalcArrivageTotals(id, userProfile.organizationId);

    const arrivage = await prisma.arrivage.findFirst({
      where: { id, organizationId: userProfile.organizationId },
      include: {
        products: {
          include: {
            category: true,
            brand: true,
          },
        },
        expenses: true,
      },
    });

    if (!arrivage) {
      return NextResponse.json({ error: 'Arrivage not found' }, { status: 404 });
    }

    // Format response
    const toNumber = (value: unknown) =>
      typeof value === 'number'
        ? value
        : typeof (value as { toNumber?: () => number })?.toNumber === 'function'
          ? (value as { toNumber: () => number }).toNumber()
          : Number(value) || 0;

    const shipment = {
      id: arrivage.id,
      reference: arrivage.reference,
      purchaseDate: arrivage.purchaseDate,
      shipDate: arrivage.shipDate,
      receivedDate: arrivage.receivedDate,
      status: arrivage.status,
      source: arrivage.source,
      invoices: arrivage.invoices,
      exchangeRate: toNumber(arrivage.exchangeRate),
      totalCostEur: toNumber(arrivage.totalCostEur),
      shippingCostEur: toNumber(arrivage.shippingCostEur),
      packagingCostEur: toNumber(arrivage.packagingCostEur),
      totalCostDh: toNumber(arrivage.totalCostDh),
      productCount: arrivage.productCount,
      totalUnits: arrivage.totalUnits,
      carrier: arrivage.carrier,
      trackingNumber: arrivage.trackingNumber,
      notes: arrivage.notes,
      products: arrivage.products,
      expenses: arrivage.expenses,
      createdAt: arrivage.createdAt,
      updatedAt: arrivage.updatedAt,
    };

    return NextResponse.json(shipment);
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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    if (!hasPermission(userProfile.role, 'ARRIVAGES_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const existingArrivage = await prisma.arrivage.findFirst({
      where: { id, organizationId: userProfile.organizationId },
      include: { products: true },
    });

    if (!existingArrivage) {
      return NextResponse.json({ error: 'Arrivage not found' }, { status: 404 });
    }

    // Update arrivage
    const nextExchangeRate = body.exchangeRate !== undefined
      ? body.exchangeRate
      : existingArrivage.exchangeRate;

    const arrivage = await prisma.arrivage.update({
      where: { id },
      data: {
        reference: body.reference || existingArrivage.reference,
        purchaseDate: body.purchaseDate !== undefined 
          ? (body.purchaseDate ? new Date(body.purchaseDate) : null) 
          : existingArrivage.purchaseDate,
        shipDate: body.shipDate !== undefined 
          ? (body.shipDate ? new Date(body.shipDate) : null) 
          : existingArrivage.shipDate,
        receivedDate: body.receivedDate !== undefined 
          ? (body.receivedDate ? new Date(body.receivedDate) : null) 
          : existingArrivage.receivedDate,
        status: body.status || existingArrivage.status,
        source: body.source || existingArrivage.source,
        invoices: body.invoices || existingArrivage.invoices,
        exchangeRate: nextExchangeRate,
        shippingCostEur: body.shippingCostEur !== undefined 
          ? body.shippingCostEur 
          : existingArrivage.shippingCostEur,
        packagingCostEur: body.packagingCostEur !== undefined 
          ? body.packagingCostEur 
          : existingArrivage.packagingCostEur,
        totalCostEur: existingArrivage.totalCostEur,
        totalCostDh: existingArrivage.totalCostDh,
        carrier: body.carrier !== undefined ? body.carrier : existingArrivage.carrier,
        trackingNumber: body.trackingNumber !== undefined 
          ? body.trackingNumber 
          : existingArrivage.trackingNumber,
        notes: body.notes !== undefined ? body.notes : existingArrivage.notes,
      },
      include: {
        products: {
          include: {
            category: true,
            brand: true,
          },
        },
        expenses: true,
      },
    });

    await recalcArrivageTotals(id, userProfile.organizationId);

    // Format response
    const shipment = {
      id: arrivage.id,
      reference: arrivage.reference,
      purchaseDate: arrivage.purchaseDate,
      shipDate: arrivage.shipDate,
      receivedDate: arrivage.receivedDate,
      status: arrivage.status,
      source: arrivage.source,
      invoices: arrivage.invoices,
      exchangeRate: arrivage.exchangeRate,
      totalCostEur: arrivage.totalCostEur,
      shippingCostEur: arrivage.shippingCostEur,
      packagingCostEur: arrivage.packagingCostEur,
      totalCostDh: arrivage.totalCostDh,
      productCount: arrivage.productCount,
      totalUnits: arrivage.totalUnits,
      carrier: arrivage.carrier,
      trackingNumber: arrivage.trackingNumber,
      notes: arrivage.notes,
      products: arrivage.products,
      expenses: arrivage.expenses,
      createdAt: arrivage.createdAt,
      updatedAt: arrivage.updatedAt,
    };

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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    if (!hasPermission(userProfile.role, 'ARRIVAGES_DELETE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const arrivage = await prisma.arrivage.findFirst({
      where: { id, organizationId: userProfile.organizationId },
    });

    if (!arrivage) {
      return NextResponse.json({ error: 'Arrivage not found' }, { status: 404 });
    }

    // Delete arrivage
    await prisma.arrivage.delete({
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
