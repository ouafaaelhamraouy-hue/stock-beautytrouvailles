# RBAC Implementation Summary

## Overview
Implemented comprehensive Role-Based Access Control (RBAC) with 3 roles (SUPER_ADMIN, ADMIN, STAFF), stock adjustment feature, and enhanced sales validation.

---

## Files Changed

### Schema & Permissions
1. **`prisma/schema.prisma`**
   - Added `SUPER_ADMIN` to `UserRole` enum

2. **`src/lib/permissions.ts`**
   - Complete rewrite with 3-role hierarchy
   - Added new permissions: `STOCK_ADJUST`, `STOCK_READ`, `PRODUCTS_EDIT_COSTS`, `USERS_MANAGE_ROLES`, `EXPORT`
   - Updated all existing permissions to include SUPER_ADMIN
   - Added helper functions: `isSuperAdmin()`, `canManageRoles()`, `canAccessAdminPages()`

### Stock Adjustment Feature
3. **`src/app/api/products/[id]/adjust-stock/route.ts`** (NEW)
   - POST endpoint for stock adjustments
   - Validates delta, reason, notes
   - Enforces "never below zero" rule
   - Creates `StockMovement` record with type `ADJUSTMENT`
   - Uses transactions for atomicity

4. **`src/app/api/products/[id]/stock-movements/route.ts`** (NEW)
   - GET endpoint for stock movement history
   - Returns all movements (sales, adjustments, arrivages) with user info

5. **`src/components/products/StockAdjustmentDialog.tsx`** (NEW)
   - Modal dialog for stock adjustments
   - Increase/Decrease toggle
   - Reason field (required)
   - Notes field (optional)
   - Real-time preview of new stock
   - Blocks negative stock

6. **`src/components/products/ProductsTable.tsx`**
   - Added "Adjust Stock" action button
   - Integrated `StockAdjustmentDialog`
   - Added `onAdjustStock` prop

7. **`src/components/products/ProductDetailsPanel.tsx`**
   - Added "Adjust Stock" button
   - Added `onAdjustStock` prop

8. **`src/app/[locale]/(dashboard)/products/page.tsx`**
   - Added stock adjustment dialog state management
   - Connected to both ProductsTable and ProductDetailsPanel

### Sales Enhancement
9. **`src/app/api/sales/route.ts`**
   - Added custom deal validation: notes required if `pricePerUnit < purchasePriceMad`
   - Stock validation already present (quantity <= availableStock)

### API Route Permission Updates
10. **`src/app/api/products/route.ts`**
    - GET: `PRODUCTS_READ` check
    - POST: `PRODUCTS_CREATE` check

11. **`src/app/api/products/[id]/route.ts`**
    - GET: `PRODUCTS_READ` check
    - PATCH: `PRODUCTS_UPDATE` + `PRODUCTS_EDIT_COSTS` (if editing costs)
    - DELETE: `PRODUCTS_DELETE` check

12. **`src/app/api/shipments/route.ts`**
    - Updated permissions from `SHIPMENTS_*` to `ARRIVAGES_*`

13. **`src/app/api/shipments/[id]/route.ts`**
    - Updated permissions from `SHIPMENTS_*` to `ARRIVAGES_*`

14. **`src/app/api/shipments/[id]/items/route.ts`**
    - Updated permissions from `SHIPMENTS_*` to `ARRIVAGES_*`

15. **`src/app/api/shipments/[id]/items/[itemId]/route.ts`**
    - Updated permissions from `SHIPMENTS_*` to `ARRIVAGES_*`

16. **`src/app/api/expenses/route.ts`**
    - GET: `EXPENSES_READ` check (already present)
    - POST: `EXPENSES_CREATE` check (already present)

17. **`src/app/api/settings/route.ts`**
    - GET: Added `SETTINGS_READ` check
    - PUT: Changed to `SETTINGS_UPDATE` (SUPER_ADMIN only)

18. **`src/app/api/admin/create-admin/route.ts`**
    - Updated to use `USERS_MANAGE_ROLES` permission
    - Added role parameter support
    - Added `canManageRoles()` validation

19. **`src/app/api/admin/bootstrap-super-admin/route.ts`** (NEW)
    - One-time bootstrap endpoint for first SUPER_ADMIN
    - Only works if no SUPER_ADMIN exists
    - Uses env var or request body for email

### Route Guards
20. **`src/components/auth/RouteGuard.tsx`** (NEW)
    - Client-side route protection component
    - Supports `requireAdmin` and `requireSuperAdmin` flags
    - Shows loading state, redirects on access denied

21. **`src/app/[locale]/(dashboard)/shipments/page.tsx`**
    - Wrapped with `<RouteGuard requireAdmin>`

22. **`src/app/[locale]/(dashboard)/settings/page.tsx`**
    - Wrapped with `<RouteGuard requireAdmin>`

23. **`src/app/[locale]/(dashboard)/admin/make-admin/page.tsx`**
    - Wrapped with `<RouteGuard requireSuperAdmin>`

### Documentation
24. **`docs/RBAC.md`** (NEW)
    - Complete permissions matrix
    - API routes documentation
    - Manual testing checklist
    - Bootstrap instructions

---

## API Routes with Permission Checks

### Products
- ✅ `GET /api/products` → `PRODUCTS_READ`
- ✅ `POST /api/products` → `PRODUCTS_CREATE`
- ✅ `GET /api/products/[id]` → `PRODUCTS_READ`
- ✅ `PATCH /api/products/[id]` → `PRODUCTS_UPDATE` + `PRODUCTS_EDIT_COSTS` (if editing costs)
- ✅ `DELETE /api/products/[id]` → `PRODUCTS_DELETE`
- ✅ `POST /api/products/[id]/adjust-stock` → `STOCK_ADJUST` (NEW)
- ✅ `GET /api/products/[id]/stock-movements` → `STOCK_READ` (NEW)

### Arrivages
- ✅ `GET /api/shipments` → `ARRIVAGES_READ`
- ✅ `POST /api/shipments` → `ARRIVAGES_CREATE`
- ✅ `GET /api/shipments/[id]` → `ARRIVAGES_READ`
- ✅ `PUT /api/shipments/[id]` → `ARRIVAGES_UPDATE`
- ✅ `DELETE /api/shipments/[id]` → `ARRIVAGES_DELETE`
- ✅ `POST /api/shipments/[id]/items` → `ARRIVAGES_UPDATE`
- ✅ `PUT /api/shipments/[id]/items/[itemId]` → `ARRIVAGES_UPDATE`
- ✅ `DELETE /api/shipments/[id]/items/[itemId]` → `ARRIVAGES_UPDATE`

### Sales
- ✅ `GET /api/sales` → `SALES_READ`
- ✅ `POST /api/sales` → `SALES_CREATE` + custom deal validation
- ✅ `GET /api/sales/[id]` → `SALES_READ`
- ✅ `PUT /api/sales/[id]` → `SALES_UPDATE`
- ✅ `DELETE /api/sales/[id]` → `SALES_DELETE`

### Expenses
- ✅ `GET /api/expenses` → `EXPENSES_READ`
- ✅ `POST /api/expenses` → `EXPENSES_CREATE`
- ✅ `GET /api/expenses/[id]` → `EXPENSES_READ`
- ✅ `PUT /api/expenses/[id]` → `EXPENSES_UPDATE`
- ✅ `DELETE /api/expenses/[id]` → `EXPENSES_DELETE`

### Settings
- ✅ `GET /api/settings` → `SETTINGS_READ`
- ✅ `PUT /api/settings` → `SETTINGS_UPDATE` (SUPER_ADMIN only)

### Admin
- ✅ `POST /api/admin/create-admin` → `USERS_MANAGE_ROLES` (SUPER_ADMIN only)
- ✅ `POST /api/admin/bootstrap-super-admin` → No auth required (one-time bootstrap)

---

## Key Features Implemented

### 1. Stock Adjustment (Audited)
- ✅ All roles can adjust stock (audited)
- ✅ Increase/Decrease toggle
- ✅ Reason required
- ✅ Notes optional
- ✅ Never allows negative stock
- ✅ Creates `StockMovement` record
- ✅ Accessible from Products table and detail panel

### 2. Sales Custom Deal Rules
- ✅ Regular/Promo/Custom price modes (already implemented in QuickSale)
- ✅ Notes required when custom price < cost
- ✅ Server-side validation
- ✅ Stock guardrails (quantity <= availableStock)

### 3. Route Guards
- ✅ `/shipments` - ADMIN/SUPER_ADMIN only
- ✅ `/settings` - ADMIN/SUPER_ADMIN only
- ✅ `/admin/make-admin` - SUPER_ADMIN only

### 4. Bootstrap SUPER_ADMIN
- ✅ One-time setup endpoint
- ✅ Environment variable support
- ✅ Prevents duplicate SUPER_ADMIN creation

---

## Next Steps

1. **Run Prisma Migration**:
   ```bash
   npx prisma migrate dev --name add_super_admin_role
   ```

2. **Bootstrap First SUPER_ADMIN**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/bootstrap-super-admin \
     -H "Content-Type: application/json" \
     -d '{"email": "your-admin@example.com"}'
   ```

3. **Test All Scenarios**:
   - Follow the manual testing checklist in `docs/RBAC.md`

---

## Notes

- All permission checks are **server-side** (API routes)
- UI hides actions based on permissions, but API enforces them
- Stock adjustments are **always audited** (no direct stock edits)
- Custom deals require notes when below cost (prevents accidental losses)
- Route guards redirect unauthorized users to `/dashboard`
