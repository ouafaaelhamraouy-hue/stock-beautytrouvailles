import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * Get low stock alerts
 * Returns products with low stock (currentStock <= reorderLevel or currentStock === 0)
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

    // Get all active products
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        quantityReceived: true,
        quantitySold: true,
        reorderLevel: true,
        category: {
          select: {
            name: true,
            nameFr: true,
          },
        },
      },
    });

    // Calculate current stock and filter for low stock
    const lowStockProducts = products
      .map((product) => {
        const currentStock = product.quantityReceived - product.quantitySold;
        return {
          id: product.id,
          name: product.name,
          currentStock,
          reorderLevel: product.reorderLevel,
          category: product.category.nameFr || product.category.name,
        };
      })
      .filter((product) => product.currentStock <= product.reorderLevel || product.currentStock === 0)
      .sort((a, b) => a.currentStock - b.currentStock) // Sort by stock (lowest first)
      .slice(0, limit); // Take top N

    return NextResponse.json({ products: lowStockProducts });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
