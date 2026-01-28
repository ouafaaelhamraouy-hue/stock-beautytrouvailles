import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

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

    if (!hasPermission(userProfile.role, 'PRODUCTS_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body; // Array of { id, ...fields }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    const canEditCosts = hasPermission(userProfile.role, 'PRODUCTS_EDIT_COSTS');
    const allowedFields = new Set([
      'name',
      'brandId',
      'categoryId',
      'purchaseSource',
      'sellingPriceDh',
      'promoPriceDh',
      'reorderLevel',
      'isActive',
      'arrivageId',
    ]);
    const costFields = new Set(['purchasePriceEur', 'purchasePriceMad']);
    const forbiddenFields = new Set(['quantityReceived', 'quantitySold']);

    // Process updates in a transaction
    const results = await Promise.allSettled(
      updates.map(async (update: Record<string, unknown>) => {
        const { id, ...updateData } = update || {};
        if (!id) {
          throw new Error('Missing product id');
        }

        // Disallow direct stock edits
        for (const field of forbiddenFields) {
          if (updateData[field] !== undefined) {
            throw new Error(`Field not allowed: ${field}`);
          }
        }

        // Disallow cost edits without permission
        if (!canEditCosts) {
          for (const field of costFields) {
            if (updateData[field] !== undefined) {
              throw new Error(`Field not allowed: ${field}`);
            }
          }
        }

        // Allow only known fields
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updateData)) {
          if (allowedFields.has(key) || (canEditCosts && costFields.has(key))) {
            sanitized[key] = value;
          } else if (value !== undefined) {
            throw new Error(`Field not allowed: ${key}`);
          }
        }

        if (Object.keys(sanitized).length === 0) {
          throw new Error('No valid fields to update');
        }

        return prisma.product.update({
          where: { id },
          data: sanitized,
          include: {
            category: true,
            arrivage: true,
          },
        });
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      updated: successful,
      failed,
      results: results.map((r, i) => ({
        index: i,
        success: r.status === 'fulfilled',
        error: r.status === 'rejected' ? (r as PromiseRejectedResult).reason : null,
      })),
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
