import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * Get top products by revenue (top 10)
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

    // Get all sales grouped by product
    const sales = await prisma.sale.findMany({
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Group by product and calculate totals
    const productStats = sales.reduce((acc, sale) => {
      const productId = sale.productId;
      if (!acc[productId]) {
        acc[productId] = {
          product: sale.product,
          totalRevenue: 0,
          totalQuantity: 0,
          salesCount: 0,
        };
      }
      acc[productId].totalRevenue += sale.totalAmount;
      acc[productId].totalQuantity += sale.quantity;
      acc[productId].salesCount += 1;
      return acc;
    }, {} as Record<string, {
      product: typeof sales[0]['product'];
      totalRevenue: number;
      totalQuantity: number;
      salesCount: number;
    }>);

    // Convert to array, sort by revenue, and take top 10
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
      .map((stat) => ({
        product: stat.product,
        totalRevenue: stat.totalRevenue,
        totalQuantity: stat.totalQuantity,
        salesCount: stat.salesCount,
      }));

    return NextResponse.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
