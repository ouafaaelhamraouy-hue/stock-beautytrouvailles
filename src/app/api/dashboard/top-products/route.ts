import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Get top products by quantity sold
 */
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get all products with sales, sorted by quantity sold
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        quantitySold: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        quantitySold: true,
        category: {
          select: {
            name: true,
            nameFr: true,
          },
        },
      },
      orderBy: {
        quantitySold: 'desc',
      },
      take: limit,
    });

    // Format response
    const topProducts = products.map((product) => ({
      name: product.name,
      totalSold: product.quantitySold,
      category: product.category.nameFr || product.category.name,
    }));

    return NextResponse.json({ products: topProducts });
  } catch (error) {
    console.error('Error fetching top products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
