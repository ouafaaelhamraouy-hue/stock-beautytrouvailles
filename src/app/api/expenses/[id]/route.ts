import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

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

    if (!hasPermission(userProfile.role, 'EXPENSES_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        arrivage: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

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

    return NextResponse.json(formattedExpense);
  } catch (error) {
    console.error('Error fetching expense:', error);
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

    if (!hasPermission(userProfile.role, 'EXPENSES_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { date, amountEUR, amountDH, description, type, shipmentId, arrivageId } = body;

    // Support both shipmentId (for backward compatibility) and arrivageId
    const finalArrivageId = arrivageId || shipmentId;

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Verify arrivage exists if provided
    if (finalArrivageId !== undefined && finalArrivageId !== null) {
      const arrivage = await prisma.arrivage.findUnique({
        where: { id: finalArrivageId },
      });

      if (!arrivage) {
        return NextResponse.json({ error: 'Arrivage not found' }, { status: 404 });
      }
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: date ? new Date(date) : existingExpense.date,
        amountEUR: amountEUR !== undefined ? amountEUR : existingExpense.amountEUR,
        amountDH: amountDH !== undefined ? amountDH : existingExpense.amountDH,
        description: description || existingExpense.description,
        type: type || existingExpense.type,
        arrivageId: finalArrivageId !== undefined ? (finalArrivageId || null) : existingExpense.arrivageId,
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

    return NextResponse.json(formattedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
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

    if (!hasPermission(userProfile.role, 'EXPENSES_DELETE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
