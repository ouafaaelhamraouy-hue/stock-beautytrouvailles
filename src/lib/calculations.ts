import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;

/**
 * Calculate current stock
 * 
 * Formula:
 * Current Stock = Quantity Received - Quantity Sold
 */
export function calculateCurrentStock(
  quantityReceived: number,
  quantitySold: number
): number {
  return Math.max(0, quantityReceived - quantitySold);
}

/**
 * Calculate profit margin percentage (GROSS - without packaging)
 * 
 * Formula:
 * Margin % = ((Selling Price - Purchase Price) ÷ Selling Price) × 100
 */
export function calculateMargin(
  sellingPriceDh: number | Decimal,
  purchasePriceDh: number | Decimal
): number {
  const selling = typeof sellingPriceDh === 'number' ? sellingPriceDh : sellingPriceDh.toNumber();
  const purchase = typeof purchasePriceDh === 'number' ? purchasePriceDh : purchasePriceDh.toNumber();

  if (selling === 0) return 0;

  const profit = selling - purchase;
  const margin = (profit / selling) * 100;

  return Number(margin.toFixed(2));
}

/**
 * Calculate NET profit margin percentage (includes packaging costs)
 * 
 * Formula:
 * Net Margin % = ((Selling Price - Purchase Price - Packaging Cost) ÷ Selling Price) × 100
 * 
 * Default packaging cost: 8.00 DH (from Excel Charges sheet)
 */
export function calculateNetMargin(
  sellingPriceDh: number | Decimal,
  purchasePriceDh: number | Decimal,
  packagingCost: number = 8.00
): number {
  const selling = typeof sellingPriceDh === 'number' ? sellingPriceDh : sellingPriceDh.toNumber();
  const purchase = typeof purchasePriceDh === 'number' ? purchasePriceDh : purchasePriceDh.toNumber();

  if (selling === 0) return 0;

  const netProfit = selling - purchase - packagingCost;
  const netMargin = (netProfit / selling) * 100;

  return Number(netMargin.toFixed(2));
}

/**
 * Calculate margin amount (profit per unit)
 */
export function calculateMarginAmount(
  sellingPriceDh: number | Decimal,
  purchasePriceDh: number | Decimal
): number {
  const selling = typeof sellingPriceDh === 'number' ? sellingPriceDh : sellingPriceDh.toNumber();
  const purchase = typeof purchasePriceDh === 'number' ? purchasePriceDh : purchasePriceDh.toNumber();

  return Number((selling - purchase).toFixed(2));
}

/**
 * Get margin color based on percentage
 * Returns: 'success' (green) > 40%, 'warning' (yellow) 30-40%, 'error' (red) < 30%
 */
export function getMarginColor(margin: number): 'success' | 'warning' | 'error' {
  if (margin >= 40) return 'success';
  if (margin >= 30) return 'warning';
  return 'error';
}

/**
 * Calculate total value of inventory in DH
 */
export function calculateInventoryValue(
  products: Array<{
    quantityReceived: number;
    quantitySold: number;
    sellingPriceDh: number | Decimal;
  }>
): number {
  return products.reduce((total, product) => {
    const stock = calculateCurrentStock(product.quantityReceived, product.quantitySold);
    const price = typeof product.sellingPriceDh === 'number' 
      ? product.sellingPriceDh 
      : product.sellingPriceDh.toNumber();
    return total + (stock * price);
  }, 0);
}

/**
 * Calculate average margin across products (GROSS)
 */
export function calculateAverageMargin(
  products: Array<{
    purchasePriceMad: number | Decimal;
    sellingPriceDh: number | Decimal;
  }>
): number {
  if (products.length === 0) return 0;

  const margins = products
    .map((product) => {
      return calculateMargin(product.sellingPriceDh, product.purchasePriceMad);
    })
    .filter((margin) => margin > 0); // Only count products with positive margins

  if (margins.length === 0) return 0;

  const sum = margins.reduce((acc, margin) => acc + margin, 0);
  return Number((sum / margins.length).toFixed(2));
}

/**
 * Calculate average NET margin across products (includes packaging costs)
 */
export function calculateAverageNetMargin(
  products: Array<{
    purchasePriceMad: number | Decimal;
    sellingPriceDh: number | Decimal;
  }>,
  packagingCost: number = 8.00
): number {
  if (products.length === 0) return 0;

  const netMargins = products
    .map((product) => {
      return calculateNetMargin(product.sellingPriceDh, product.purchasePriceMad, packagingCost);
    })
    .filter((margin) => margin > 0); // Only count products with positive margins

  if (netMargins.length === 0) return 0;

  const sum = netMargins.reduce((acc, margin) => acc + margin, 0);
  return Number((sum / netMargins.length).toFixed(2));
}

/**
 * Calculate net margin amount (profit per unit after packaging)
 */
export function calculateNetMarginAmount(
  sellingPriceDh: number | Decimal,
  purchasePriceDh: number | Decimal,
  packagingCost: number = 8.00
): number {
  const selling = typeof sellingPriceDh === 'number' ? sellingPriceDh : sellingPriceDh.toNumber();
  const purchase = typeof purchasePriceDh === 'number' ? purchasePriceDh : purchasePriceDh.toNumber();

  return Number((selling - purchase - packagingCost).toFixed(2));
}

/**
 * Calculate total revenue from sales
 */
export function calculateTotalRevenue(
  products: Array<{
    quantitySold: number;
    sellingPriceDh: number | Decimal;
    promoPriceDh?: number | Decimal | null;
    // Note: In real scenario, we'd track which sales were at promo vs regular
    // For now, assume all sold at regular price unless promoPriceDh is set
  }>
): number {
  return products.reduce((total, product) => {
    const price = typeof product.sellingPriceDh === 'number' 
      ? product.sellingPriceDh 
      : product.sellingPriceDh.toNumber();
    return total + (product.quantitySold * price);
  }, 0);
}

/**
 * Calculate sale total amount
 * Formula: quantity × pricePerUnit
 */
export function calculateSaleTotal(
  quantity: number,
  pricePerUnit: number
): number {
  return Number((quantity * pricePerUnit).toFixed(2));
}

/**
 * Calculate shipment total cost in EUR
 * Formula: shippingCostEUR + packagingCostEUR + itemsCostEUR
 */
export function calculateShipmentTotalEUR(
  shippingCostEUR: number,
  packagingCostEUR: number,
  itemsCostEUR: number
): number {
  return Number((shippingCostEUR + packagingCostEUR + itemsCostEUR).toFixed(2));
}

/**
 * Calculate shipment total cost in DH
 * Formula: totalCostEUR × exchangeRate
 */
export function calculateShipmentTotalDH(
  totalCostEUR: number,
  exchangeRate: number | Decimal
): number {
  const rate = typeof exchangeRate === 'number' ? exchangeRate : exchangeRate.toNumber();
  return Number((totalCostEUR * rate).toFixed(2));
}
