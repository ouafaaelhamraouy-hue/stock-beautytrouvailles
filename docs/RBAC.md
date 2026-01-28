# Role-Based Access Control (RBAC) Documentation

## Overview

The BeautyTrouvailles system implements a 3-tier role-based access control system:
- **SUPER_ADMIN**: Full access + user/role/settings management
- **ADMIN**: Full operational access (products, arrivages, expenses, export)
- **STAFF**: Limited access (view, create sales, adjust stock)

---

## Role Hierarchy

```
SUPER_ADMIN
  ├── All ADMIN permissions
  └── User management
  └── Role assignment
  └── Settings management

ADMIN
  ├── All STAFF permissions
  ├── Product CRUD
  ├── Arrivage management
  ├── Expense management
  └── Export functionality

STAFF
  ├── View dashboard/products/brands/categories
  ├── Create sales
  └── Stock adjustments (audited)
```

---

## Permissions Matrix

| Action | SUPER_ADMIN | ADMIN | STAFF |
|--------|-------------|-------|-------|
| **Products** |
| View products | ✅ | ✅ | ✅ |
| Create products | ✅ | ✅ | ❌ |
| Edit products | ✅ | ✅ | ❌ |
| Edit purchase costs | ✅ | ✅ | ❌ |
| Delete products | ✅ | ✅ | ❌ |
| **Arrivages (Shipments)** |
| View arrivages | ✅ | ✅ | ✅ |
| Create arrivages | ✅ | ✅ | ❌ |
| Edit arrivages | ✅ | ✅ | ❌ |
| Delete arrivages | ✅ | ✅ | ❌ |
| **Sales** |
| View sales | ✅ | ✅ | ✅ |
| Create sales | ✅ | ✅ | ✅ |
| Edit sales | ✅ | ✅ | ❌ |
| Delete sales | ✅ | ✅ | ❌ |
| **Stock** |
| View stock | ✅ | ✅ | ✅ |
| Adjust stock (audited) | ✅ | ✅ | ✅ |
| **Expenses** |
| View expenses | ✅ | ✅ | ❌ |
| Create expenses | ✅ | ✅ | ❌ |
| Edit expenses | ✅ | ✅ | ❌ |
| Delete expenses | ✅ | ✅ | ❌ |
| **Dashboard** |
| View dashboard | ✅ | ✅ | ✅ |
| **Reports** |
| View reports | ✅ | ✅ | ✅ |
| **Export** |
| Export data | ✅ | ✅ | ❌ |
| **Settings** |
| View settings | ✅ | ✅ | ❌ |
| Update settings | ✅ | ❌ | ❌ |
| **Users** |
| View users | ✅ | ❌ | ❌ |
| Create users | ✅ | ❌ | ❌ |
| Edit users | ✅ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ |
| Manage roles | ✅ | ❌ | ❌ |

---

## Stock Adjustment Rules

### All Roles Can Adjust Stock
- **Purpose**: Stock adjustments are audited via `StockMovement` records
- **Fields Required**:
  - `delta` (positive for increase, negative for decrease)
  - `reason` (required, max 200 chars)
  - `notes` (optional, max 500 chars)
- **Guardrails**:
  - ❌ **Never allow stock to go below zero**
  - ✅ Creates `StockMovement` record with `type: 'ADJUSTMENT'`
  - ✅ Records `previousQty`, `newQty`, `userId`, `timestamp`

### Stock Adjustment Logic
- **Positive delta**: Increases `quantityReceived`
- **Negative delta**: Increases `quantitySold` (reduces available stock)
- **Validation**: `currentStock + delta >= 0` (enforced server-side)

---

## Sales Rules

### Price Modes
1. **Regular**: Uses `product.sellingPriceDh`
2. **Promo**: Uses `product.promoPriceDh` (if missing → forces Custom mode)
3. **Custom**: Manual unit price in DH

### Custom Deal Rules
- ✅ Custom deals are **allowed**
- ⚠️ If `pricePerUnit < purchasePriceMad`:
  - **Notes are REQUIRED** (enforced server-side)
  - Error: "Notes are required when selling below cost price"
- ❌ Sales that would make stock negative are blocked:
  - Error: "Insufficient stock. Available: X, Requested: Y"

### Server-Side Validation
- `totalAmount` is computed server-side: `quantity * pricePerUnit`
- Client-provided `totalAmount` is ignored (security)

---

## API Routes Updated

### Products
- **GET `/api/products`**: `PRODUCTS_READ` check
- **POST `/api/products`**: `PRODUCTS_CREATE` check
- **GET `/api/products/[id]`**: `PRODUCTS_READ` check
- **PATCH `/api/products/[id]`**: 
  - `PRODUCTS_UPDATE` check
  - `PRODUCTS_EDIT_COSTS` check (if editing purchase prices)
- **DELETE `/api/products/[id]`**: `PRODUCTS_DELETE` check
- **POST `/api/products/[id]/adjust-stock`**: `STOCK_ADJUST` check
- **GET `/api/products/[id]/stock-movements`**: `STOCK_READ` check

### Arrivages (Shipments)
- **GET `/api/shipments`**: `ARRIVAGES_READ` check
- **POST `/api/shipments`**: `ARRIVAGES_CREATE` check
- **GET `/api/shipments/[id]`**: `ARRIVAGES_READ` check
- **PUT `/api/shipments/[id]`**: `ARRIVAGES_UPDATE` check
- **DELETE `/api/shipments/[id]`**: `ARRIVAGES_DELETE` check
- **POST `/api/shipments/[id]/items`**: `ARRIVAGES_UPDATE` check
- **PUT `/api/shipments/[id]/items/[itemId]`**: `ARRIVAGES_UPDATE` check
- **DELETE `/api/shipments/[id]/items/[itemId]`**: `ARRIVAGES_UPDATE` check

### Sales
- **GET `/api/sales`**: `SALES_READ` check
- **POST `/api/sales`**: 
  - `SALES_CREATE` check
  - Stock validation (quantity <= availableStock)
  - Custom deal validation (notes required if price < cost)
- **GET `/api/sales/[id]`**: `SALES_READ` check
- **PUT `/api/sales/[id]`**: `SALES_UPDATE` check
- **DELETE `/api/sales/[id]`**: `SALES_DELETE` check

### Expenses
- **GET `/api/expenses`**: `EXPENSES_READ` check
- **POST `/api/expenses`**: `EXPENSES_CREATE` check
- **GET `/api/expenses/[id]`**: `EXPENSES_READ` check
- **PUT `/api/expenses/[id]`**: `EXPENSES_UPDATE` check
- **DELETE `/api/expenses/[id]`**: `EXPENSES_DELETE` check

### Settings
- **GET `/api/settings`**: `SETTINGS_READ` check
- **PUT `/api/settings`**: `SETTINGS_UPDATE` check (SUPER_ADMIN only)

### Users/Admin
- **POST `/api/admin/create-admin`**: 
  - `USERS_MANAGE_ROLES` check (SUPER_ADMIN only)
  - Validates role assignment permissions
- **POST `/api/admin/bootstrap-super-admin`**: 
  - One-time bootstrap (only works if no SUPER_ADMIN exists)
  - Uses `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` env var or request body

### Dashboard
- **GET `/api/dashboard/*`**: `DASHBOARD_READ` check

---

## Route Guards

### Client-Side Route Guards
Protected pages use `<RouteGuard>` component:

- **`/shipments`**: `requireAdmin={true}` (ADMIN/SUPER_ADMIN only)
- **`/settings`**: `requireAdmin={true}` (ADMIN/SUPER_ADMIN only)
- **`/admin/make-admin`**: `requireSuperAdmin={true}` (SUPER_ADMIN only)

### Guard Behavior
- Shows loading spinner while checking permissions
- Redirects to `/dashboard` if access denied
- Redirects to `/login` if not authenticated

---

## Bootstrap SUPER_ADMIN

### Security
The bootstrap endpoint has multiple security layers:
- ✅ **Authentication Required**: Must be logged in
- ✅ **One-Time Only**: Disabled after first SUPER_ADMIN exists
- ✅ **Self-Bootstrap**: Can only bootstrap yourself (or if no users exist)
- ✅ **Optional Email Allowlist**: Restrict which emails can be bootstrapped
- ✅ **Optional Production Secret**: Extra security layer for production

See [BOOTSTRAP_SECURITY.md](./BOOTSTRAP_SECURITY.md) for detailed security documentation.

### Method 1: API Endpoint (Recommended)
```bash
POST /api/admin/bootstrap-super-admin
Body: { "email": "admin@example.com" }
```

**Requirements:**
- No SUPER_ADMIN exists in database
- User must be authenticated (logged in)
- User must exist in Supabase Auth
- User must have logged in once (to create profile)
- In production: May require `BOOTSTRAP_SECRET` (see security docs)

### Method 2: Environment Variable
Set `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` in `.env.local`:
```env
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=admin@example.com
```

Then call the bootstrap endpoint (email from env will be used if not provided in body).

### Method 3: Direct Database (Emergency)
If needed, directly update the database:
```sql
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'admin@example.com';
```

---

## Manual Testing Checklist

### STAFF Role Tests

#### ✅ Staff Sale (Regular Price)
1. Login as STAFF user
2. Go to `/quick-sale` or Products page
3. Select product, choose "Regular" price mode
4. Enter quantity (within available stock)
5. Complete sale
6. **Expected**: Sale created, stock decreases, appears in Sales page

#### ✅ Staff Custom Deal Sale (Below Cost - Notes Required)
1. Login as STAFF user
2. Go to `/quick-sale`
3. Select product, choose "Custom" price mode
4. Enter price **below cost** (e.g., cost=100, price=80)
5. Try to complete sale **without notes**
6. **Expected**: Error "Notes are required when selling below cost price"
7. Add notes, complete sale
8. **Expected**: Sale created successfully

#### ✅ Staff Stock Adjustment (+)
1. Login as STAFF user
2. Go to Products page
3. Click "Adjust Stock" on a product
4. Select "Increase (+)"
5. Enter quantity (e.g., 5)
6. Enter reason (required)
7. Apply adjustment
8. **Expected**: Stock increases, `StockMovement` record created

#### ✅ Staff Stock Adjustment (-)
1. Login as STAFF user
2. Go to Products page
3. Click "Adjust Stock" on a product with stock > 0
4. Select "Decrease (-)"
5. Enter quantity less than current stock
6. Enter reason (required)
7. Apply adjustment
8. **Expected**: Stock decreases, `StockMovement` record created

#### ✅ Staff Cannot Go Below Zero
1. Login as STAFF user
2. Go to Products page
3. Click "Adjust Stock" on a product with stock = 2
4. Select "Decrease (-)"
5. Enter quantity = 5 (more than available)
6. Enter reason
7. Try to apply
8. **Expected**: Error "Cannot adjust stock below zero. Current stock: 2, Delta: -5"
9. Adjustment is **not** applied

#### ✅ Staff Blocked from Admin Pages
1. Login as STAFF user
2. Try to access `/shipments`
3. **Expected**: Redirected to `/dashboard`
4. Try to access `/settings`
5. **Expected**: Redirected to `/dashboard`
6. Try to access `/admin/make-admin`
7. **Expected**: Redirected to `/dashboard`

### ADMIN Role Tests

#### ✅ Admin Can Create Arrivages
1. Login as ADMIN user
2. Go to `/shipments`
3. Create new arrivage
4. **Expected**: Arrivage created successfully

#### ✅ Admin Can Edit Purchase Costs
1. Login as ADMIN user
2. Go to Products page
3. Edit a product
4. Change `purchasePriceMad`
5. **Expected**: Product updated successfully

#### ✅ Admin Cannot Manage Users
1. Login as ADMIN user
2. Try to access `/admin/make-admin`
3. **Expected**: Redirected to `/dashboard`

### SUPER_ADMIN Role Tests

#### ✅ SUPER_ADMIN Can Manage Users
1. Login as SUPER_ADMIN user
2. Go to `/admin/make-admin`
3. Assign ADMIN role to a user
4. **Expected**: User role updated successfully

#### ✅ SUPER_ADMIN Can Update Settings
1. Login as SUPER_ADMIN user
2. Go to `/settings`
3. Update packaging costs
4. **Expected**: Settings saved successfully

---

## Implementation Files

### Core Files
- `src/lib/permissions.ts` - Permission definitions and helpers
- `src/components/auth/RouteGuard.tsx` - Client-side route protection
- `prisma/schema.prisma` - UserRole enum (SUPER_ADMIN, ADMIN, STAFF)

### Stock Adjustment
- `src/app/api/products/[id]/adjust-stock/route.ts` - Stock adjustment API
- `src/app/api/products/[id]/stock-movements/route.ts` - Stock movements history API
- `src/components/products/StockAdjustmentDialog.tsx` - Stock adjustment UI

### Bootstrap
- `src/app/api/admin/bootstrap-super-admin/route.ts` - One-time SUPER_ADMIN setup

### Protected Pages
- `src/app/[locale]/(dashboard)/shipments/page.tsx` - Protected with RouteGuard
- `src/app/[locale]/(dashboard)/settings/page.tsx` - Protected with RouteGuard
- `src/app/[locale]/(dashboard)/admin/make-admin/page.tsx` - Protected with RouteGuard

---

## Security Notes

1. **Server-Side Validation**: All permission checks are enforced in API routes, not just UI
2. **No Direct Stock Edits**: Stock can only be adjusted via the audited adjustment feature
3. **Role Assignment**: Only SUPER_ADMIN can assign SUPER_ADMIN role
4. **Custom Deals**: Notes are required when selling below cost (prevents accidental losses)
5. **Stock Guardrails**: Stock cannot go negative (enforced server-side)

---

## Migration Notes

After adding `SUPER_ADMIN` role to schema:

```bash
npx prisma migrate dev --name add_super_admin_role
# or
npx prisma db push
```

Then bootstrap the first SUPER_ADMIN:
```bash
curl -X POST http://localhost:3000/api/admin/bootstrap-super-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```
