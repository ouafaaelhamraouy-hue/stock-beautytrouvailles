import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { Prisma, PurchaseSource } from '@prisma/client';

type ImportedProduct = {
  name?: string;
  categoryName?: string;
  purchasePriceEur?: number;
  purchasePriceMad?: number;
  sellingPriceDh?: number;
  promoPriceDh?: number;
  quantityReceived?: number;
  quantitySold?: number;
  purchaseSource?: string;
};

type SheetData = {
  sheetName: string;
  products: ImportedProduct[];
};

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

    if (!hasPermission(userProfile.role, 'PRODUCTS_CREATE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sheets } = body as { sheets?: SheetData[] };

    if (!Array.isArray(sheets) || sheets.length === 0) {
      return NextResponse.json(
        { error: 'Sheets array is required and must not be empty' },
        { status: 400 }
      );
    }

    const results = {
      arrivagesCreated: 0,
      productsCreated: 0,
      productsLinked: 0,
      skipped: 0,
      errors: [] as Array<{ sheet: string; product: string; error: string }>,
    };

    const defaultExchangeRate = 10.85; // Default exchange rate

    // Process each sheet (COMMANDE sheet = one Arrivage)
    for (const sheetData of sheets) {
        const { sheetName, products } = sheetData as SheetData;

      if (!sheetName || !Array.isArray(products) || products.length === 0) {
        results.skipped++;
        continue;
      }

      try {
        // Create or find Arrivage for this sheet
        // Sheet name format: "COMMANDE 1111" becomes reference "COMMANDE 1111"
        let arrivage = await prisma.arrivage.findUnique({
          where: { reference: sheetName },
        });

        if (!arrivage) {
          // Create new Arrivage
          // Calculate totals from products
          const totalUnits = products.reduce((sum: number, p: ImportedProduct) => sum + (p.quantityReceived || 0), 0);
          const uniqueProducts = new Set(
            products.map((p: ImportedProduct) => p.name?.toLowerCase().trim()).filter(Boolean)
          );
          
          // Calculate total cost in MAD (sum of all purchase prices)
          const totalCostMad = products.reduce((sum: number, p: ImportedProduct) => {
            return sum + ((p.purchasePriceMad || 0) * (p.quantityReceived || 0));
          }, 0);

          // Estimate EUR costs (divide by exchange rate)
          const totalCostEur = totalCostMad / defaultExchangeRate;

          arrivage = await prisma.arrivage.create({
            data: {
              reference: sheetName,
              source: 'OTHER', // Default, can be updated later
              exchangeRate: defaultExchangeRate,
              totalCostEur,
              shippingCostEur: 0,
              packagingCostEur: 0,
              totalCostDh: totalCostMad,
              productCount: uniqueProducts.size,
              totalUnits,
              status: 'RECEIVED', // Assume received if importing
              receivedDate: new Date(),
            },
          });
          results.arrivagesCreated++;
        }

        // Process products in this sheet
        for (const productData of products) {
          const {
            name,
            categoryName,
            purchasePriceEur,
            purchasePriceMad,
            sellingPriceDh,
            promoPriceDh,
            quantityReceived,
            quantitySold,
            purchaseSource,
          } = productData;

          try {
            // Validate and skip invalid rows
            const nameStr = name?.toString().trim() || '';

            // Skip if Produit is empty/null
            if (!nameStr || nameStr === '') {
              results.skipped++;
              continue;
            }

            // Skip if Produit contains "TOTAL" (case insensitive)
            if (nameStr.toUpperCase().includes('TOTAL')) {
              results.skipped++;
              continue;
            }

            // Skip if it's clearly a header row
            const headerPatterns = ['PRODUIT', 'PRODUCT', 'NOM', 'NAME', 'ARTICLE'];
            if (headerPatterns.some(pattern => nameStr.toUpperCase() === pattern)) {
              results.skipped++;
              continue;
            }

            // Skip if PA and Quantité are both empty/null (summary rows)
            const hasPurchasePrice = (purchasePriceMad && purchasePriceMad > 0) || (purchasePriceEur && purchasePriceEur > 0);
            if (!hasPurchasePrice && (!quantityReceived || quantityReceived === 0)) {
              results.skipped++;
              continue;
            }

            // Skip if all price columns are 0 or empty
            if ((!purchasePriceMad || purchasePriceMad === 0) &&
                (!purchasePriceEur || purchasePriceEur === 0) &&
                (!sellingPriceDh || sellingPriceDh === 0) &&
                (!promoPriceDh || promoPriceDh === 0) &&
                (!quantityReceived || quantityReceived === 0)) {
              results.skipped++;
              continue;
            }

            // Validate required fields - must have at least one of: PA, PV, or Quantité with value > 0
            const hasValidData = 
              (purchasePriceMad && purchasePriceMad > 0) ||
              (purchasePriceEur && purchasePriceEur > 0) ||
              (sellingPriceDh && sellingPriceDh > 0) ||
              (quantityReceived && quantityReceived > 0);

            if (!hasValidData) {
              results.errors.push({
                sheet: sheetName,
                product: nameStr,
                error: 'Product must have at least one of: PA, PV, or Quantité with value > 0',
              });
              results.skipped++;
              continue;
            }

            // Set defaults for missing required fields
            const finalPurchasePriceMad = purchasePriceMad && purchasePriceMad > 0 ? purchasePriceMad : 0;
            const finalSellingPriceDh = sellingPriceDh && sellingPriceDh > 0 ? sellingPriceDh : 0;

            // If no purchase price but we have selling price, we still need a purchase price
            // Use a default or skip
            if (finalPurchasePriceMad === 0 && (!purchasePriceEur || purchasePriceEur === 0)) {
              results.errors.push({
                sheet: sheetName,
                product: nameStr,
                error: 'Purchase price (PA) is required',
              });
              results.skipped++;
              continue;
            }

            if (finalSellingPriceDh === 0) {
              results.errors.push({
                sheet: sheetName,
                product: nameStr,
                error: 'Selling price (PV) is required',
              });
              results.skipped++;
              continue;
            }

            // Find or create category
            let category;
            if (categoryName && categoryName.trim()) {
              category = await prisma.category.findUnique({
                where: { name: categoryName.trim() },
              });

              if (!category) {
                category = await prisma.category.create({
                  data: {
                    name: categoryName.trim(),
                    description: null,
                  },
                });
              }
            } else {
              // Use default category or create one
              category = await prisma.category.findFirst();
              if (!category) {
                category = await prisma.category.create({
                  data: {
                    name: 'Uncategorized',
                    description: 'Default category for imported products',
                  },
                });
              }
            }

            // Calculate MAD from EUR if EUR is provided but MAD is not
            let finalPurchasePriceMadValue = finalPurchasePriceMad;
            if (purchasePriceEur && purchasePriceEur > 0 && finalPurchasePriceMadValue === 0) {
              finalPurchasePriceMadValue = purchasePriceEur * arrivage.exchangeRate.toNumber();
            }

            // Check if product with same name exists (but create new record for this arrivage)
            // Same product can appear in multiple arrivages, so we create a new product record
            // linked to this specific arrivage

            const purchaseSourceValue = Object.values(PurchaseSource).includes(
              (purchaseSource || '').toString().toUpperCase() as PurchaseSource
            )
              ? ((purchaseSource || '').toString().toUpperCase() as PurchaseSource)
              : PurchaseSource.OTHER;

            // Create product linked to this arrivage
            await prisma.product.create({
              data: {
                name: nameStr,
                brandId: null, // Use brandId instead of brand
                categoryId: category.id,
                purchaseSource: purchaseSourceValue,
                purchasePriceEur: purchasePriceEur && purchasePriceEur > 0 ? purchasePriceEur : null,
                purchasePriceMad: finalPurchasePriceMadValue,
                sellingPriceDh: finalSellingPriceDh,
                promoPriceDh: promoPriceDh && promoPriceDh > 0 ? promoPriceDh : null,
                quantityReceived: quantityReceived || 0,
                quantitySold: quantitySold || 0,
                reorderLevel: 5, // Default reorder level
                arrivageId: arrivage.id, // Link to this arrivage
              },
            });

            results.productsCreated++;
          } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              // Unique constraint violation (shouldn't happen with current schema)
              results.skipped++;
            } else {
              results.errors.push({
                sheet: sheetName,
                product: name?.toString() || 'N/A',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
              results.skipped++;
            }
          }
        }
      } catch (error: unknown) {
        results.errors.push({
          sheet: sheetName,
          product: 'N/A',
          error: error instanceof Error ? error.message : 'Failed to process sheet',
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      totalSheets: sheets.length,
      arrivagesCreated: results.arrivagesCreated,
      productsCreated: results.productsCreated,
      skipped: results.skipped,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
