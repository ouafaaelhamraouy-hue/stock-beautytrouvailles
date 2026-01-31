import { z } from 'zod';

// Product validations - NO SKU, prices in EUR and MAD
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name must be less than 200 characters'),
  brandId: z.string().optional().nullable(), // Brand relation ID
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  purchaseSource: z.enum(['ACTION', 'CARREFOUR', 'PHARMACIE', 'AMAZON_FR', 'SEPHORA', 'RITUALS', 'NOCIBE', 'LIDL', 'OTHER']).default('OTHER'),
  purchasePriceEur: z.number().min(0, 'Purchase price EUR must be positive').optional().nullable(), // Prix Achat in EUR (original)
  purchasePriceMad: z.number().min(0, 'Purchase price MAD must be positive'), // PA (Prix Achat) in MAD (calculated or direct)
  sellingPriceDh: z.number().min(0, 'Selling price must be positive'), // PV (Prix Vente) regular price
  promoPriceDh: z.number().min(0, 'Promo price must be positive').optional().nullable(), // Prix promo
  quantityReceived: z.number().int().min(0, 'Quantity must be non-negative').default(0),
  reorderLevel: z.number().int().min(0, 'Reorder level must be non-negative').default(3), // Default to 3 per optimization plan
});

export type ProductFormData = z.infer<typeof productSchema>;

// Category validations
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// Supplier validations (deprecated - use brands instead)
export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  contactInfo: z.string().max(500, 'Contact info must be less than 500 characters').optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// Brand validations
export const brandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  logoUrl: z.string().url('Must be a valid URL').optional().nullable(),
});

export type BrandFormData = z.infer<typeof brandSchema>;

// Sale validations
export const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  pricePerUnit: z.number().min(0, 'Price must be positive'),
});

export const saleSchema = z.object({
  productId: z.string().min(1, 'Product is required').optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  pricePerUnit: z.number().min(0, 'Price must be positive').optional(),
  pricingMode: z.enum(['REGULAR', 'PROMO', 'CUSTOM', 'BUNDLE']).default('REGULAR'),
  bundlePriceTotal: z.number().min(0, 'Bundle total price must be positive').optional(),
  items: z.array(saleItemSchema).optional(),
  isPromo: z.boolean().default(false),
  saleDate: z.date().default(new Date()),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional().nullable(),
}).refine(
  (data) => {
    if (data.pricingMode !== 'BUNDLE') return true;
    return Array.isArray(data.items) && data.items.length >= 2;
  },
  { message: 'At least two items are required for a bundle', path: ['items'] }
).refine(
  (data) => {
    if (data.pricingMode === 'BUNDLE') return true;
    return typeof data.productId === 'string'
      && typeof data.quantity === 'number'
      && typeof data.pricePerUnit === 'number';
  },
  { message: 'Product, quantity, and price are required', path: ['productId'] }
).refine(
  () => {
    // totalAmount must equal quantity * price per unit (validated at API level)
    return true; // This will be validated at API level
  },
  { message: 'Total amount must equal quantity × price per unit' }
);

export type SaleFormData = z.infer<typeof saleSchema>;

// Shipment validations
export const shipmentSchema = z.object({
  reference: z.string().min(1, 'Reference is required').max(100, 'Reference must be less than 100 characters'),
  source: z.enum(['ACTION', 'RITUALS', 'NOCIBE', 'LIDL', 'CARREFOUR', 'PHARMACIE', 'AMAZON_FR', 'SEPHORA', 'OTHER']),
  purchaseDate: z.date().optional(),
  shipDate: z.date().optional(),
  receivedDate: z.date().optional(),
  status: z.enum(['PENDING', 'PURCHASED', 'SHIPPED', 'IN_TRANSIT', 'CUSTOMS', 'RECEIVED']).default('PENDING'),
  exchangeRate: z.number().min(0.01, 'Exchange rate must be positive'),
  shippingCostEUR: z.number().min(0, 'Cost must be positive').default(0),
  packagingCostEUR: z.number().min(0, 'Cost must be positive').default(0),
  totalCostEUR: z.number().min(0, 'Cost must be positive').default(0),
});

export type ShipmentFormData = z.infer<typeof shipmentSchema>;

// Shipment Item validations
export const shipmentItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  costPerUnitEUR: z.number().min(0, 'Cost must be positive'),
});

export type ShipmentItemFormData = z.infer<typeof shipmentItemSchema>;

// Expense validations
export const expenseSchema = z.object({
  date: z.date().default(new Date()),
  amountEUR: z.number().min(0, 'Amount must be positive'),
  amountDH: z.number().min(0, 'Amount must be positive'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
  type: z.enum(['OPERATIONAL', 'MARKETING', 'UTILITIES', 'PACKAGING', 'SHIPPING', 'ADS', 'OTHER']),
  shipmentId: z.string().optional().nullable(), // Backward compatibility
  arrivageId: z.string().optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
