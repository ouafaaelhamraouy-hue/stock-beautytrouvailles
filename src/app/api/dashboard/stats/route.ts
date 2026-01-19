import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function GET() {
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

    // Dashboard is readable by all authenticated users (ADMIN and STAFF)
    // Permission check is optional here, but we keep it for consistency

    // Get total products count
    const totalProducts = await prisma.product.count();

    // Get total shipments count
    const totalShipments = await prisma.shipment.count();

    // Get total sales count
    const totalSales = await prisma.sale.count();

    // Calculate total inventory (sum of quantityRemaining from all shipment items)
    const inventoryResult = await prisma.shipmentItem.aggregate({
      _sum: {
        quantityRemaining: true,
      },
    });
    const totalInventory = inventoryResult._sum.quantityRemaining || 0;

    // Calculate total revenue (sum of totalAmount from all sales)
    const revenueResult = await prisma.sale.aggregate({
      _sum: {
        totalAmount: true,
      },
    });
    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Calculate total expenses
    const expensesResult = await prisma.expense.aggregate({
      _sum: {
        amountEUR: true,
      },
    });
    const totalExpenses = expensesResult._sum.amountEUR || 0;

    // Calculate total cost from shipments
    const shipmentsResult = await prisma.shipment.aggregate({
      _sum: {
        totalCostEUR: true,
      },
    });
    const totalCosts = shipmentsResult._sum.totalCostEUR || 0;

    // Calculate profit (revenue - costs - expenses)
    const totalProfit = totalRevenue - totalCosts - totalExpenses;

    return NextResponse.json({
      totalProducts,
      totalShipments,
      totalSales,
      totalInventory,
      totalRevenue,
      totalExpenses,
      totalCosts,
      totalProfit,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
