import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
      select: { id: true, isActive: true, organizationId: true },
    });

    if (!userProfile || !userProfile.isActive) {
      return NextResponse.json({ error: 'User not active' }, { status: 403 });
    }

    if (!userProfile.organizationId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      where: { isActive: true, organizationId: userProfile.organizationId },
      select: {
        quantityReceived: true,
        quantitySold: true,
        reorderLevel: true,
      },
    });

    let healthy = 0;
    let low = 0;
    let out = 0;

    products.forEach((product) => {
      const stock = product.quantityReceived - product.quantitySold;
      if (stock <= 0) {
        out += 1;
      } else if (stock <= product.reorderLevel) {
        low += 1;
      } else {
        healthy += 1;
      }
    });

    return NextResponse.json({
      healthy,
      low,
      out,
      total: healthy + low + out,
    });
  } catch (error) {
    console.error('Error fetching stock health:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
