import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hasPermission } from '@/lib/permissions';

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

    if (!hasPermission(userProfile.role, 'EXPENSES_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const arrivageId = searchParams.get('arrivageId') || searchParams.get('shipmentId'); // Support both for backward compatibility
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limitParam = parseInt(searchParams.get('limit') || '100');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 100;
    const sortParam = searchParams.get('sort') || 'date';
    const allowedSorts = new Set(['date', 'createdAt', 'updatedAt']);
    const sort = allowedSorts.has(sortParam) ? sortParam : 'date';

    // Build where clause
    const where: Prisma.ExpenseWhereInput = {};
    if (arrivageId) {
      where.arrivageId = arrivageId;
    }
    if (type) {
      where.type = type;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        arrivage: true,
      },
      orderBy: {
        [sort]: 'desc',
      },
      take: limit,
    });

    // Format response to match expected structure (with shipment for backward compatibility)
    const formattedExpenses = expenses.map((expense) => ({
      ...expense,
      shipmentId: expense.arrivageId,
      shipment: expense.arrivage ? {
        id: expense.arrivage.id,
        reference: expense.arrivage.reference,
        supplier: {
          name: expense.arrivage.source, // Using source as supplier name
        },
      } : null,
    }));

    return NextResponse.json(formattedExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
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

    if (!hasPermission(userProfile.role, 'EXPENSES_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { date, amountEUR, amountDH, description, type, shipmentId, arrivageId } = body;

    // Support both shipmentId (for backward compatibility) and arrivageId
    const finalArrivageId = arrivageId || shipmentId;

    // Verify arrivage exists if provided
    if (finalArrivageId) {
      const arrivage = await prisma.arrivage.findUnique({
        where: { id: finalArrivageId },
      });

      if (!arrivage) {
        return NextResponse.json({ error: 'Arrivage not found' }, { status: 404 });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        date: date ? new Date(date) : new Date(),
        amountEUR,
        amountDH,
        description,
        type,
        arrivageId: finalArrivageId || null,
      },
      include: {
        arrivage: true,
      },
    });

    // Format response
    const formattedExpense = {
      ...expense,
      shipmentId: expense.arrivageId,
      shipment: expense.arrivage ? {
        id: expense.arrivage.id,
        reference: expense.arrivage.reference,
        supplier: {
          name: expense.arrivage.source,
        },
      } : null,
    };

    return NextResponse.json(formattedExpense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
