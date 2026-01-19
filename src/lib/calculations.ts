/**
 * Business logic calculations
 * All calculations are centralized here to ensure consistency
 */

/**
 * Calculate total amount for a sale
 */
export function calculateSaleTotal(quantity: number, pricePerUnit: number): number {
  return quantity * pricePerUnit;
}

/**
 * Calculate shipment total cost in EUR
 */
export function calculateShipmentTotalEUR(
  shippingCostEUR: number,
  customsCostEUR: number,
  packagingCostEUR: number,
  itemsCostEUR: number
): number {
  return shippingCostEUR + customsCostEUR + packagingCostEUR + itemsCostEUR;
}

/**
 * Calculate shipment total cost in DH
 */
export function calculateShipmentTotalDH(totalCostEUR: number, exchangeRate: number): number {
  return totalCostEUR * exchangeRate;
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return ((revenue - cost) / cost) * 100;
}

/**
 * Calculate profit amount
 */
export function calculateProfit(revenue: number, cost: number): number {
  return revenue - cost;
}

/**
 * Calculate total quantity in stock for a product
 * Sum of all quantityRemaining from shipment items
 */
export function calculateProductStockQuantity(quantityRemaining: number[]): number {
  return quantityRemaining.reduce((sum, qty) => sum + qty, 0);
}

/**
 * Calculate total quantity sold for a product
 * Sum of all quantitySold from shipment items
 */
export function calculateProductSoldQuantity(quantitySold: number[]): number {
  return quantitySold.reduce((sum, qty) => sum + qty, 0);
}

/**
 * Calculate total revenue for a product
 * Sum of all sale totalAmount
 */
export function calculateProductRevenue(saleAmounts: number[]): number {
  return saleAmounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Calculate average selling price
 */
export function calculateAverageSellingPrice(totalRevenue: number, totalQuantity: number): number {
  if (totalQuantity === 0) return 0;
  return totalRevenue / totalQuantity;
}

/**
 * Calculate margin for a product sale
 */
export function calculateProductSaleMargin(
  salePrice: number,
  costPerUnit: number
): number {
  return salePrice - costPerUnit;
}

/**
 * Calculate margin percentage for a product sale
 */
export function calculateProductSaleMarginPercent(
  salePrice: number,
  costPerUnit: number
): number {
  if (costPerUnit === 0) return 0;
  return ((salePrice - costPerUnit) / costPerUnit) * 100;
}
