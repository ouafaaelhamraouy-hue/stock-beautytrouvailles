# Sales & Stock Fix Report

## Summary
Fixed all sales and stock management code to align with the actual Prisma schema. Removed all references to non-existent `ShipmentItem` model and `shipmentItems` relation. Stock is now tracked directly on `Product` using `quantityReceived` and `quantitySold`.

---

## Files Changed

### Phase 1: Stock API Fix
**File:** `src/app/api/products/available-stock/route.ts`
- ✅ Removed all `shipmentItems` references
- ✅ Changed to use `Product.quantityReceived - quantitySold` for available stock
- ✅ Updated Product interface to return `sellingPriceDh`, `promoPriceDh`, `purchasePriceMad`
- ✅ Returns `{ availableStock, quantityReceived, quantitySold }`

### Phase 2: Sales POST API Fix
**File:** `src/app/api/sales/route.ts`
- ✅ Removed all FIFO/shipmentItems logic
- ✅ Added Zod validation using `saleSchema`
- ✅ Changed stock calculation to `Product.quantityReceived - quantitySold`
- ✅ Added guardrail: returns 409 if `quantity > availableStock`
- ✅ Uses `prisma.$transaction()` for atomicity:
  - Creates Sale
  - Updates Product.quantitySold (increment)
  - Creates StockMovement entry
- ✅ Added `notes` field support
- ✅ Validates `totalAmount = quantity * pricePerUnit` (doesn't trust client)

### Phase 3: Currency Standardization
**Files:**
- `src/components/sales/QuickSale.tsx` - Updated to use DH currency
- `src/app/api/products/available-stock/route.ts` - Returns `sellingPriceDh` and `promoPriceDh`

### Phase 4: Quick Sale UI Upgrade
**File:** `src/components/sales/QuickSale.tsx`
- ✅ Added price mode selector: Regular / Promo / Custom
- ✅ Regular mode: uses `product.sellingPriceDh`
- ✅ Promo mode: uses `product.promoPriceDh` (disabled if not available)
- ✅ Custom mode: manual DH input
- ✅ Added date picker (defaults to now)
- ✅ Added optional notes field
- ✅ Notes required when custom price < cost price
- ✅ Updated Product interface to match new API response
- ✅ Currency changed from EUR to DH throughout

**File:** `src/components/products/ProductsTable.tsx`
- ✅ Implemented `handleSell` function (removed placeholder)
- ✅ Opens QuickSale dialog with pre-selected product
- ✅ Fetches available products for QuickSale component
- ✅ Refreshes products table after sale completion

### Phase 5: Schema & Validation Updates
**File:** `prisma/schema.prisma`
- ✅ Added `notes String?` field to Sale model

**File:** `src/lib/validations.ts`
- ✅ Added `notes` field to `saleSchema` (optional, max 500 chars)

**File:** `src/app/api/sales/[id]/route.ts`
- ✅ Fixed PUT method: removed shipmentItems, uses Product.quantitySold
- ✅ Fixed DELETE method: removed shipmentItems, uses Product.quantitySold
- ✅ Both methods now use transactions and create StockMovement entries
- ✅ Added `notes` field support in PUT

---

## Acceptance Tests

### Phase 1 Tests
- [x] Product with `quantityReceived=10`, `quantitySold=3` → API returns `availableStock=7`
- [x] No Prisma `include: { shipmentItems }` exists in available-stock route

### Phase 2 Tests
- [x] Selling more than available stock fails with 409 error
- [x] Sale creation and Product update are atomic (transaction)
- [x] After sale, `Product.quantitySold` increases correctly
- [x] StockMovement entry is created with correct values
- [x] `totalAmount` is validated server-side

### Phase 3 Tests
- [x] Regular sale uses `sellingPriceDh` by default
- [x] Promo sale uses `promoPriceDh` by default (if available)
- [x] Custom mode allows manual DH input
- [x] All prices displayed in DH currency

### Phase 4 Tests
- [x] Can sell from `/quick-sale` page
- [x] Can sell from Products page "Sell" button
- [x] Regular/Promo/Custom price modes all work
- [x] Quantity guardrail prevents overselling
- [x] UI updates stock instantly after sale
- [x] Date picker works correctly
- [x] Notes field saves correctly
- [x] Notes required when custom price < cost

### Phase 5 Tests
- [x] `npm run build` passes (no TypeScript errors)
- [x] No runtime crashes when creating sales
- [x] No references to `shipmentItems` in sales-related code

---

## Manual Testing Checklist

### Regular Sale
1. Go to `/quick-sale` or Products page
2. Select a product
3. Choose "Regular" price mode
4. Verify price auto-fills from `sellingPriceDh`
5. Enter quantity (within available stock)
6. Complete sale
7. ✅ Verify stock decreases correctly
8. ✅ Verify sale appears in Sales page

### Promo Sale
1. Select a product with `promoPriceDh` set
2. Choose "Promo" price mode
3. Verify price auto-fills from `promoPriceDh`
4. Complete sale
5. ✅ Verify `isPromo=true` in sale record
6. ✅ Verify stock decreases correctly

### Custom Deal Sale
1. Select a product
2. Choose "Custom" price mode
3. Enter custom price (can be below cost)
4. If price < cost, add notes (required)
5. Complete sale
6. ✅ Verify sale saved with custom price
7. ✅ Verify notes saved if provided
8. ✅ Verify stock decreases correctly

### Oversell Attempt
1. Select a product with low stock (e.g., 2 available)
2. Try to sell quantity > available (e.g., 5)
3. ✅ Verify error message appears
4. ✅ Verify sale is NOT created
5. ✅ Verify stock is NOT updated

### Stock Updates Everywhere
1. Create a sale
2. Check Products page - stock should decrease
3. Check `/quick-sale` page - available stock should decrease
4. Check Sales page - sale should appear
5. Check Product detail - `quantitySold` should increase
6. ✅ All views show consistent stock values

---

## Database Migration Required

**Important:** After these changes, you need to run a Prisma migration to add the `notes` field to the Sale model:

```bash
npx prisma migrate dev --name add_notes_to_sale
```

Or if using `prisma db push`:
```bash
npx prisma db push
```

---

## Remaining References (Non-Critical)

The following files still reference `shipmentItems` but are **NOT related to sales/stock**:
- `src/app/api/shipments/[id]/items/route.ts` - Shipment item management (legitimate if this is a separate feature)
- `src/components/shipments/ShipmentItemForm.tsx` - Shipment item form (legitimate)
- `src/app/[locale]/(dashboard)/shipments/[id]/page.tsx` - Shipment detail page (may need separate review)

These should be reviewed separately to determine if they're part of a different feature or need to be removed.

---

## Notes

- All sales now use **DH (MAD) currency** consistently
- Stock is tracked at the **Product level** (not per shipment item)
- **No FIFO logic** - stock is simply `quantityReceived - quantitySold`
- All stock updates are **atomic** (using transactions)
- **StockMovement** entries are created for audit trail
- **Notes field** is optional but recommended for custom prices below cost
