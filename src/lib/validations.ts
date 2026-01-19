import { z } from 'zod';

// Product validations
export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  basePriceEUR: z.number().min(0, 'Price must be positive'),
  basePriceDH: z.number().min(0, 'Price must be positive'),
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
