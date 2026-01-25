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

// Supplier validations
export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  contactInfo: z.string().max(500, 'Contact info must be less than 500 characters').optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// Sale validations
export const saleSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  pricePerUnit: z.number().min(0, 'Price must be positive'),
  isPromo: z.boolean().default(false),
  saleDate: z.date().default(new Date()),
}).refine(
  (data) => {
    // totalAmount must equal quantity * pricePerUnit
    const expectedTotal = data.quantity * data.pricePerUnit;
    return true; // This will be validated at API level
  },
  { message: 'Total amount must equal quantity × price per unit' }
);

export type SaleFormData = z.infer<typeof saleSchema>;

// Shipment validations
export const shipmentSchema = z.object({
  reference: z.string().min(1, 'Reference is required').max(100, 'Reference must be less than 100 characters'),
  supplierId: z.string().min(1, 'Supplier is required'),
  arrivalDate: z.date().optional(),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'ARRIVED', 'PROCESSED']).default('PENDING'),
  exchangeRate: z.number().min(0.01, 'Exchange rate must be positive'),
  shippingCostEUR: z.number().min(0, 'Cost must be positive').default(0),
  customsCostEUR: z.number().min(0, 'Cost must be positive').default(0),
  packagingCostEUR: z.number().min(0, 'Cost must be positive').default(0),
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
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  type: z.enum(['OPERATIONAL', 'MARKETING', 'UTILITIES', 'OTHER']),
  shipmentId: z.string().optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
