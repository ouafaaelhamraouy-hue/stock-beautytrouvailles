# Quick Sale Feature Audit

## Executive Summary
**A Quick Sale feature already exists** in the codebase. It's located at `/quick-sale` page and uses the `QuickSale` component. However, it has limitations compared to the requirements (Regular/Promo/Custom price modes, notes field).

---

## 1. Files/Components Involved

### UI Components
- **`src/app/[locale]/(dashboard)/quick-sale/page.tsx`**
  - Main page that renders the QuickSale component
  - Fetches products with available stock from `/api/products/available-stock`
  - Handles loading/error states

- **`src/components/sales/QuickSale.tsx`**
  - Main Quick Sale UI component
  - Product selection dropdown
  - Quantity input with increment/decrement buttons
  - Price per unit input (EUR)
  - Promo toggle (checkbox)
  - Total amount calculation
  - Stock validation

- **`src/components/sales/SaleForm.tsx`**
  - Dialog form for creating/editing sales
  - Used in Sales detail page for editing
  - Similar fields to QuickSale but in a modal format
  - Includes date picker

### API Routes
- **`src/app/api/sales/route.ts`**
  - `POST /api/sales` - Creates a new sale
  - `GET /api/sales` - Fetches sales with filters (productId, date range, isPromo)
  - Handles stock updates via `ShipmentItem` updates (FIFO)

- **`src/app/api/products/available-stock/route.ts`**
  - `GET /api/products/available-stock` - Returns products with `availableStock` calculated from `quantityRemaining` in shipment items
  - Filters to only products with stock > 0

### Hooks/Utilities
- **`src/lib/calculations.ts`**
  - `calculateSaleTotal(quantity, pricePerUnit)` - Calculates total amount

- **`src/lib/validations.ts`**
  - `saleSchema` - Zod validation schema for sales
  - Fields: `productId`, `quantity`, `pricePerUnit`, `isPromo`, `saleDate`

### Navigation
- **`src/components/layout/MobileNav.tsx`** - Includes Quick Sale link
- **`src/components/layout/Sidebar.tsx`** - Should include Quick Sale in nav (verify)

---

## 2. Current UX Flow

### Where Users Trigger Sales

1. **Quick Sale Page** (`/quick-sale`)
   - Dedicated page accessible from navigation
   - Main entry point for quick sales

2. **Products Page** (`/products`)
   - Has a "Sell" button in the ProductsTable row actions (line 381)
   - **Currently NOT IMPLEMENTED** - shows toast: "Sell action for {product.name} - to be implemented"
   - `handleSell` function exists but is a placeholder

3. **Product Details Panel** (if exists)
   - `ProductDetailsPanel.tsx` has `onSell` prop but implementation is placeholder

4. **Sales Page** (`/sales`)
   - Uses `SaleForm` dialog for creating new sales
   - More comprehensive form with date picker

### Current Inputs

**QuickSale Component:**
- ✅ Product selection (dropdown with available stock)
- ✅ Quantity (number input, 1-max available stock)
- ✅ Price per unit (EUR) - manual input, defaults to `basePriceEUR`
- ✅ Promo toggle (checkbox - `isPromo`)
- ❌ **No date picker** (uses current date)
- ❌ **No notes field**
- ❌ **No price mode selection** (Regular/Promo/Custom)

**SaleForm Component:**
- ✅ Product selection
- ✅ Quantity
- ✅ Price per unit (EUR)
- ✅ Promo toggle
- ✅ Date picker
- ❌ **No notes field**
- ❌ **No price mode selection**

---

## 3. Stock Update Mechanism

### How Stock is Updated After Sale

**Location:** `src/app/api/sales/route.ts` (POST handler, lines 163-201)

**Process:**
1. **FIFO (First In, First Out) Distribution**
   - Sale quantity is distributed across `ShipmentItem` records
   - Sorted by `createdAt` (oldest first)
   - Only uses items with `quantityRemaining > 0`

2. **ShipmentItem Updates**
   ```typescript
   // For each shipment item:
   quantitySold: { increment: qty }
   quantityRemaining: { decrement: qty }
   ```

3. **Stock Calculation**
   - `availableStock` = sum of all `quantityRemaining` from shipment items
   - Calculated on-the-fly in `/api/products/available-stock`
   - **NOT stored in Product table** - relies on aggregation

4. **Validation**
   - Checks `totalAvailableStock >= quantity` before creating sale
   - Returns 400 error if insufficient stock

### Database Schema

**Product Model:**
- Does NOT have `quantitySold` or `availableStock` fields
- Stock is calculated from `ShipmentItem.quantityRemaining`

**ShipmentItem Model:**
- `quantity` - Original quantity received
- `quantitySold` - Total sold (incremented on sale)
- `quantityRemaining` - Available stock (decremented on sale)
- Formula: `quantityRemaining = quantity - quantitySold`

**Sale Model:**
- `id`, `saleDate`, `productId`, `quantity`, `pricePerUnit`, `totalAmount`, `isPromo`
- **No `notes` field** in schema

---

## 4. Gaps vs Requirements

### Missing Features

1. **Price Mode Selection**
   - ❌ No "Regular/Promo/Custom" mode selector
   - Currently: Manual price input + promo checkbox
   - Need: Radio buttons or tabs for mode selection
   - Regular: Use `sellingPriceDh` (DH currency)
   - Promo: Use `promoPriceDh` (if exists)
   - Custom: Manual input

2. **Notes Field**
   - ❌ No notes/description field in UI
   - ❌ No `notes` field in Sale schema
   - Need: Add `notes` to Prisma schema and form

3. **Currency Consistency**
   - ⚠️ QuickSale uses EUR (`basePriceEUR`)
   - ⚠️ Product has `sellingPriceDh` (DH/MAD)
   - Need: Clarify which currency to use, or support both

4. **Stock Guardrails**
   - ✅ Already implemented (quantity validation, stock checks)
   - ✅ Prevents sale if `quantity > availableStock`
   - ✅ Auto-adjusts quantity to max available
   - ✅ Shows stock warnings

5. **Date Selection**
   - ❌ QuickSale uses current date (no picker)
   - ✅ SaleForm has date picker
   - Need: Add date picker to QuickSale

6. **Products Page "Sell" Button**
   - ❌ Not implemented (placeholder)
   - Should open QuickSale or SaleForm with pre-selected product

---

## 5. Proposed Minimal Changes

### Option A: Extend QuickSale Component (Recommended)

**Changes needed:**

1. **Add Price Mode Selector**
   ```tsx
   // Add to QuickSale.tsx
   type PriceMode = 'regular' | 'promo' | 'custom';
   const [priceMode, setPriceMode] = useState<PriceMode>('regular');
   
   // Calculate price based on mode:
   // - regular: product.sellingPriceDh
   // - promo: product.promoPriceDh || product.sellingPriceDh
   // - custom: manual input
   ```

2. **Add Notes Field**
   ```tsx
   const [notes, setNotes] = useState<string>('');
   // Add TextField for notes
   ```

3. **Add Date Picker**
   ```tsx
   // Use LocalizationProvider + DatePicker (like SaleForm)
   const [saleDate, setSaleDate] = useState<Date | null>(new Date());
   ```

4. **Update API Schema**
   ```prisma
   // prisma/schema.prisma - Sale model
   model Sale {
     // ... existing fields
     notes String?  // Add this
   }
   ```

5. **Update Validation Schema**
   ```typescript
   // src/lib/validations.ts
   export const saleSchema = z.object({
     // ... existing
     notes: z.string().max(500).optional().nullable(),
   });
   ```

6. **Update API Route**
   ```typescript
   // src/app/api/sales/route.ts - POST handler
   const { productId, quantity, pricePerUnit, isPromo, saleDate, notes } = body;
   // Include notes in sale creation
   ```

7. **Implement Products Page "Sell" Button**
   ```typescript
   // src/components/products/ProductsTable.tsx
   const handleSell = (product: Product) => {
     // Open QuickSale dialog or navigate to /quick-sale?productId=...
     // Pre-select product
   };
   ```

### Option B: Enhance SaleForm and Use It Everywhere

- Make SaleForm the single source of truth
- Add price mode selector to SaleForm
- Use SaleForm in QuickSale page (replace inline form)
- Use SaleForm when clicking "Sell" in Products table

**Pros:** Single component to maintain, consistent UX
**Cons:** More refactoring needed

---

## 6. Files to Modify (Minimal Approach)

1. **`src/components/sales/QuickSale.tsx`**
   - Add price mode selector
   - Add notes field
   - Add date picker
   - Update price calculation logic

2. **`prisma/schema.prisma`**
   - Add `notes String?` to Sale model
   - Run migration

3. **`src/lib/validations.ts`**
   - Add `notes` to `saleSchema`

4. **`src/app/api/sales/route.ts`**
   - Accept `notes` in POST body
   - Include in sale creation

5. **`src/components/products/ProductsTable.tsx`**
   - Implement `handleSell` to open QuickSale or navigate

6. **`src/app/api/products/available-stock/route.ts`**
   - Ensure it returns `sellingPriceDh` and `promoPriceDh` (verify)

---

## 7. Current Data Flow

```
User selects product
  ↓
QuickSale component
  ↓
User enters quantity, price, promo toggle
  ↓
POST /api/sales
  ↓
API validates stock (checks quantityRemaining)
  ↓
Creates Sale record
  ↓
Updates ShipmentItem records (FIFO)
  - quantitySold += qty
  - quantityRemaining -= qty
  ↓
Returns success
  ↓
QuickSale refreshes product list
```

---

## 8. Recommendations

1. **Extend QuickSale** rather than building duplicate
2. **Add price mode selector** (Regular/Promo/Custom)
3. **Add notes field** to schema and UI
4. **Add date picker** to QuickSale
5. **Implement Products page "Sell" button** to open QuickSale with pre-selected product
6. **Clarify currency** - decide if QuickSale should use EUR or DH
7. **Consider making SaleForm the unified component** if both need same features

---

## 9. Testing Checklist

- [ ] QuickSale with Regular price mode
- [ ] QuickSale with Promo price mode
- [ ] QuickSale with Custom price mode
- [ ] Stock validation (prevents over-selling)
- [ ] Notes field saves correctly
- [ ] Date picker works
- [ ] Products page "Sell" button opens QuickSale
- [ ] Stock updates correctly after sale (FIFO)
- [ ] Available stock refreshes after sale
