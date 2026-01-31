import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { calculateSaleTotal } from '@/lib/calculations';
import { saleSchema } from '@/lib/validations';
import { z } from 'zod';

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

    if (!hasPermission(userProfile.role, 'SALES_READ')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const toNumber = (value: unknown) =>
      typeof value === 'number'
        ? value
        : typeof (value as { toNumber?: () => number })?.toNumber === 'function'
          ? (value as { toNumber: () => number }).toNumber()
          : Number(value) || 0;

    const normalized = {
      ...sale,
      pricePerUnit: sale.pricePerUnit !== null ? toNumber(sale.pricePerUnit) : null,
      totalAmount: toNumber(sale.totalAmount),
      bundlePriceTotal: sale.bundlePriceTotal !== null ? toNumber(sale.bundlePriceTotal) : null,
      items: sale.items?.map((item) => ({
        ...item,
        pricePerUnit: toNumber(item.pricePerUnit),
      })),
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching sale:', error);
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

    if (!hasPermission(userProfile.role, 'SALES_UPDATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      quantity: z.number().int().min(1).optional(),
      pricePerUnit: z.number().min(0).optional(),
      pricingMode: z.enum(['REGULAR', 'PROMO', 'CUSTOM', 'BUNDLE']).optional(),
      bundlePriceTotal: z.number().min(0).optional(),
      items: z.array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1),
          pricePerUnit: z.number().min(0),
        })
      ).optional(),
      isPromo: z.boolean().optional(),
      saleDate: z.string().datetime().optional(),
      notes: z.string().max(500).optional().nullable(),
    });
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const {
      quantity,
      pricePerUnit,
      pricingMode,
      bundlePriceTotal,
      items,
      isPromo,
      saleDate,
      notes,
    } = parsed.data;

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
        items: true,
      },
    });

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const finalPricingMode = pricingMode !== undefined ? pricingMode : existingSale.pricingMode;
    const finalNotes = notes !== undefined ? notes : existingSale.notes;

    const aggregateItems = (bundleItems: NonNullable<typeof items>) => {
      const map = new Map<string, { productId: string; quantity: number; pricePerUnit: number }>();
      for (const item of bundleItems) {
        const existing = map.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.pricePerUnit = item.pricePerUnit;
        } else {
          map.set(item.productId, { ...item });
        }
      }
      return Array.from(map.values());
    };

    if (finalPricingMode === 'BUNDLE' || existingSale.pricingMode === 'BUNDLE') {
      if (!items || items.length < 2) {
        return NextResponse.json(
          { error: 'Bundle items are required for bundle sales' },
          { status: 400 }
        );
      }

      const bundleItems = aggregateItems(items);
      const productIds = bundleItems.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      if (products.length !== productIds.length) {
        return NextResponse.json({ error: 'One or more products not found' }, { status: 404 });
      }

      const previousByProduct = new Map<string, number>();
      for (const item of existingSale.items) {
        previousByProduct.set(item.productId, (previousByProduct.get(item.productId) || 0) + item.quantity);
      }

      const newByProduct = new Map<string, number>();
      for (const item of bundleItems) {
        newByProduct.set(item.productId, (newByProduct.get(item.productId) || 0) + item.quantity);
      }

      for (const item of bundleItems) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const purchasePriceMad = product.purchasePriceMad ? Number(product.purchasePriceMad) : 0;
        if (purchasePriceMad > 0 && item.pricePerUnit < purchasePriceMad) {
          if (!finalNotes || finalNotes.trim().length === 0) {
            return NextResponse.json(
              { error: 'Notes are required when selling below cost price' },
              { status: 400 }
            );
          }
        }
      }

      for (const [productId, newQty] of newByProduct.entries()) {
        const prevQty = previousByProduct.get(productId) || 0;
        const diff = newQty - prevQty;
        if (diff > 0) {
          const product = products.find((p) => p.id === productId);
          if (!product) continue;
          const availableStock = product.quantityReceived - product.quantitySold;
          if (diff > availableStock) {
            return NextResponse.json(
              { error: `Insufficient stock for ${product.name}. Available: ${availableStock}, Additional needed: ${diff}` },
              { status: 409 }
            );
          }
        }
      }

      const totalAmount = bundleItems.reduce(
        (sum, item) => sum + item.quantity * item.pricePerUnit,
        0
      );

      if (typeof bundlePriceTotal === 'number' && Math.abs(bundlePriceTotal - totalAmount) > 0.01) {
        return NextResponse.json(
          { error: 'Bundle total mismatch. Expected: ' + totalAmount + ', Got: ' + bundlePriceTotal },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update stock per product diff
        for (const [productId, newQty] of newByProduct.entries()) {
          const prevQty = previousByProduct.get(productId) || 0;
          const diff = newQty - prevQty;
          if (diff === 0) continue;

          const product = await tx.product.findUnique({ where: { id: productId } });
          if (product) {
            const previousQty = product.quantityReceived - product.quantitySold;
            const newQty = product.quantityReceived - (product.quantitySold + diff);
            await tx.stockMovement.create({
              data: {
                productId,
                type: diff > 0 ? 'SALE' : 'RETURN',
                quantity: -diff,
                previousQty,
                newQty,
                reference: `Sale ${id} (bundle updated)`,
                userId: user.id,
                organizationId: userProfile.organizationId,
              },
            });
          }
        }

        await tx.saleItem.deleteMany({ where: { saleId: id } });

        const sale = await tx.sale.update({
          where: { id },
          data: {
            productId: null,
            quantity: null,
            pricePerUnit: null,
            totalAmount,
            pricingMode: 'BUNDLE',
            bundlePriceTotal: totalAmount,
            isPromo: true,
            saleDate: saleDate ? new Date(saleDate) : existingSale.saleDate,
            notes: finalNotes,
            items: {
              create: bundleItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                organizationId: userProfile.organizationId,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        });

        return sale;
      });

      return NextResponse.json(result);
    }

    if (!existingSale.productId) {
      return NextResponse.json({ error: 'Product not found for this sale' }, { status: 404 });
    }

    const quantityDiff = quantity !== undefined ? quantity - (existingSale.quantity || 0) : 0;
    if (quantityDiff !== 0) {
      const product = await prisma.product.findUnique({
        where: { id: existingSale.productId },
      });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      const availableStock = product.quantityReceived - product.quantitySold;
      if (quantityDiff > 0 && quantityDiff > availableStock) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${availableStock}, Additional needed: ${quantityDiff}` },
          { status: 409 }
        );
      }
    }

    const finalQuantity = quantity !== undefined ? quantity : existingSale.quantity;
    const finalPricePerUnit =
      pricePerUnit !== undefined ? pricePerUnit : existingSale.pricePerUnit;

    if (typeof finalQuantity !== 'number' || typeof finalPricePerUnit !== 'number') {
      return NextResponse.json({ error: 'Quantity and price are required' }, { status: 400 });
    }

    const purchasePriceMad = existingSale.product?.purchasePriceMad
      ? Number(existingSale.product.purchasePriceMad)
      : 0;
    if (purchasePriceMad > 0 && finalPricePerUnit < purchasePriceMad) {
      if (!finalNotes || finalNotes.trim().length === 0) {
        return NextResponse.json(
          { error: 'Notes are required when selling below cost price' },
          { status: 400 }
        );
      }
    }

    const validationResult = saleSchema.safeParse({
      productId: existingSale.productId,
      quantity: finalQuantity,
      pricePerUnit: finalPricePerUnit,
      pricingMode: finalPricingMode,
      isPromo: isPromo !== undefined ? isPromo : existingSale.isPromo,
      saleDate: saleDate ? new Date(saleDate) : existingSale.saleDate,
      notes: finalNotes,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const totalAmount = calculateSaleTotal(finalQuantity, finalPricePerUnit);

    const result = await prisma.$transaction(async (tx) => {
      if (quantityDiff !== 0) {
        const product = await tx.product.findUnique({
          where: { id: existingSale.productId as string },
        });

        if (product) {
          const previousQty = product.quantityReceived - product.quantitySold;
          const newQty = product.quantityReceived - (product.quantitySold + quantityDiff);
          await tx.stockMovement.create({
            data: {
              productId: existingSale.productId as string,
              type: quantityDiff > 0 ? 'SALE' : 'RETURN',
              quantity: -quantityDiff,
              previousQty,
              newQty,
              reference: `Sale ${id} (updated)`,
              userId: user.id,
              organizationId: userProfile.organizationId,
            },
          });
        }
      }

      const sale = await tx.sale.update({
        where: { id },
        data: {
          productId: existingSale.productId,
          quantity: finalQuantity,
          pricePerUnit: finalPricePerUnit,
          totalAmount,
          pricingMode: finalPricingMode,
          bundlePriceTotal: null,
          isPromo: isPromo !== undefined
            ? isPromo
            : finalPricingMode === 'PROMO'
              ? true
              : existingSale.isPromo,
          saleDate: saleDate ? new Date(saleDate) : existingSale.saleDate,
          notes: finalNotes,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });

      return sale;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error updating sale:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
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

    if (!hasPermission(userProfile.role, 'SALES_DELETE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
        items: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Use transaction to restore stock and delete sale
    await prisma.$transaction(async (tx) => {
      if (sale.pricingMode === 'BUNDLE' && sale.items.length > 0) {
        for (const item of sale.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            const previousQty = product.quantityReceived - product.quantitySold;
            const newQty = product.quantityReceived - (product.quantitySold - item.quantity);
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'RETURN',
                quantity: item.quantity,
                previousQty,
                newQty,
                reference: `Sale ${id} (deleted)`,
                userId: user.id,
                organizationId: userProfile.organizationId,
              },
            });
          }
        }
      } else if (sale.productId && sale.quantity) {
        const product = await tx.product.findUnique({
          where: { id: sale.productId },
        });

        if (product) {
          const previousQty = product.quantityReceived - product.quantitySold;
          const newQty = product.quantityReceived - (product.quantitySold - sale.quantity);
          await tx.stockMovement.create({
            data: {
              productId: sale.productId,
              type: 'RETURN',
              quantity: sale.quantity,
              previousQty,
              newQty,
              reference: `Sale ${id} (deleted)`,
              userId: user.id,
              organizationId: userProfile.organizationId,
            },
          });
        }
      }

      await tx.sale.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting sale:', error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
