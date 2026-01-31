import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Get monthly revenue for the last 6 months
 * Returns data suitable for charting
 */
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
    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    // Get sales from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sales = await prisma.sale.findMany({
      where: {
        organizationId: userProfile.organizationId,
        saleDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        saleDate: true,
        totalAmount: true,
      },
      orderBy: {
        saleDate: 'asc',
      },
    });

    // Group by month
    const monthlyRevenue = sales.reduce((acc, sale) => {
      const date = new Date(sale.saleDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthLabel,
          revenue: 0,
        };
      }
      acc[monthKey].revenue += Number(sale.totalAmount);
      return acc;
    }, {} as Record<string, { month: string; revenue: number }>);

    // Convert to array and sort by month
    const revenueData = Object.values(monthlyRevenue).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
