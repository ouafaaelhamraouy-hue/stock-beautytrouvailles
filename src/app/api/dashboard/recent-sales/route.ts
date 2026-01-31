import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Get recent sales (last 10)
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

    const recentSales = await prisma.sale.findMany({
      take: 10,
      where: { organizationId: userProfile.organizationId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
    });

    return NextResponse.json(recentSales);
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
