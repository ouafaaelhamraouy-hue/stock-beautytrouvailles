# Project Audit - BeautyTrouvailles Stock Management System

## Executive Summary

- The project is a Next.js App Router application with TypeScript, MUI, Supabase Auth, and Prisma-based persistence, matching the current dependency set and documented stack. 【F:package.json†L1-L51】【F:README.md†L1-L9】
- Core application scaffolding exists: locale-aware layout providers, auth context, theme toggling, and dashboard layout shell with navigation components. 【F:src/app/[locale]/layout.tsx†L1-L32】【F:src/components/providers/ThemeProvider.tsx†L1-L83】【F:src/app/[locale]/(dashboard)/layout.tsx†L1-L132】
- There is a documentation/code mismatch: the README still states layout components are missing, while Topbar, Sidebar, and MobileNav are implemented in the codebase. 【F:README.md†L63-L76】【F:src/components/layout/Topbar.tsx†L1-L260】【F:src/components/layout/Sidebar.tsx†L1-L397】【F:src/components/layout/MobileNav.tsx†L1-L233】
- Testing is not currently defined at the package script level, which limits automated quality checks. 【F:package.json†L1-L51】

## Stack & Architecture

### Tech Stack
- **Runtime/Framework**: Next.js 15 App Router, React 18, TypeScript (strict mode is noted in the README). 【F:package.json†L20-L51】【F:README.md†L15-L25】
- **UI**: MUI v6, MUI X (Data Grid, Charts, Date Pickers), and Emotion for styling. 【F:package.json†L12-L51】
- **Data/State**: Prisma for database access, Supabase Auth/SSR clients, React Query for client-side data caching. 【F:package.json†L12-L51】【F:src/lib/prisma.ts†L1-L12】【F:src/lib/supabase/server.ts†L1-L35】【F:src/lib/query-client.ts†L1-L33】
- **Internationalization**: next-intl with locale routing. 【F:src/i18n/routing.ts†L1-L16】【F:src/app/[locale]/layout.tsx†L1-L32】

### App Structure Highlights
- **Root layout** defines the base HTML/body shell, and the locale layout wires intl, theme, auth, and query providers. 【F:src/app/layout.tsx†L1-L22】【F:src/app/[locale]/layout.tsx†L1-L32】
- **Middleware** applies locale routing and enforces authentication for non-public routes. 【F:src/middleware.ts†L1-L58】

## UI & UX Review

### Dashboard Shell
- The dashboard layout composes the **Topbar**, **Sidebar**, and **MobileNav**, and handles mobile drawer state, desktop collapse, and responsive spacing. 【F:src/app/[locale]/(dashboard)/layout.tsx†L1-L132】

### Topbar
- Provides search input, notifications placeholder, theme toggle, locale switch, and user menu with logout. 【F:src/components/layout/Topbar.tsx†L1-L260】

### Sidebar
- Implements nav sections, admin-only filtering, collapse/expand behavior, and user footer display. 【F:src/components/layout/Sidebar.tsx†L1-L397】

### Mobile Navigation
- Implements a bottom nav for main routes plus a drawer for secondary/admin items. 【F:src/components/layout/MobileNav.tsx†L1-L233】

### Authentication UI
- Login page implements password login, Google auth, and a marketing-style right panel. 【F:src/app/[locale]/(auth)/login/page.tsx†L1-L200】

## Backend/API Review

### Auth & Profiles
- Auth state is handled via Supabase in a client context, with sign-in/out and OAuth support. 【F:src/contexts/AuthContext.tsx†L1-L85】
- User profiles are fetched from Prisma, auto-created if missing, and default to STAFF with `isActive = true`. 【F:src/app/api/user/profile/route.ts†L1-L79】

### RBAC & Permissions
- Permissions are defined centrally and consumed by routes such as the admin role management endpoint. 【F:src/lib/permissions.ts†L1-L95】【F:src/app/api/admin/create-admin/route.ts†L1-L121】
- Bootstrap super-admin endpoint is protected by authentication and optional secrets/allowlists in production. 【F:src/app/api/admin/bootstrap-super-admin/route.ts†L1-L143】

### Products
- Products API supports pagination, search, and source/stock filtering with margin calculations and derived stock values. 【F:src/app/api/products/route.ts†L1-L193】

### Sales
- Sales API validates input via Zod, enforces stock availability, requires notes for below-cost sales, and performs transactional updates with stock movements. 【F:src/app/api/sales/route.ts†L1-L193】

### Calculations & Validations
- Shared calculation utilities cover stock, margins, and revenue, while Zod schemas validate products, sales, shipments, and expenses. 【F:src/lib/calculations.ts†L1-L207】【F:src/lib/validations.ts†L1-L106】

## Data Model Review (Prisma)

- **User**: profile table keyed to Supabase auth user ID with role and active status. 【F:prisma/schema.prisma†L13-L30】
- **Product**: pricing in EUR/MAD, stock counters, relations to category/brand/arrivage, and sales. 【F:prisma/schema.prisma†L54-L120】
- **Arrivage** (shipment): reference, dates, status, exchange rates, costs, and product relations. 【F:prisma/schema.prisma†L121-L180】
- **StockMovement**: audit trail for stock changes, including user references. 【F:prisma/schema.prisma†L181-L214】
- **Sale**: unit price, total, promo flag, and optional notes. 【F:prisma/schema.prisma†L215-L233】
- **Expense & Setting**: expenses tied optionally to arrivages, plus generic settings storage. 【F:prisma/schema.prisma†L235-L264】

## Internationalization & Theming

- Locale routing supports English and French, and `LocaleLayout` wires `NextIntlClientProvider`. 【F:src/i18n/routing.ts†L1-L16】【F:src/app/[locale]/layout.tsx†L1-L32】
- Theme provider supports light/dark mode with persisted preference and a shared MUI theme. 【F:src/components/providers/ThemeProvider.tsx†L1-L83】【F:src/lib/theme.ts†L1-L151】

## Performance & Data Fetching

- React Query is configured with a 1-minute stale time, 10-minute cache, and retry behavior tailored for dashboards. 【F:src/lib/query-client.ts†L1-L33】

## Tooling & Scripts

- Available scripts include Next.js lifecycle scripts and Prisma tooling (generate, push, migrate, studio, seed). 【F:package.json†L1-L19】

## Testing Status

- There is no explicit `test` script defined in `package.json`, indicating missing automated tests at the project level. 【F:package.json†L1-L19】

## Key Findings & Risks

1. **Documentation drift**: README flags missing layout components even though Topbar/Sidebar/MobileNav now exist in code. 【F:README.md†L63-L76】【F:src/components/layout/Topbar.tsx†L1-L260】【F:src/components/layout/Sidebar.tsx†L1-L397】【F:src/components/layout/MobileNav.tsx†L1-L233】
2. **PWA dependency without config**: `next-pwa` and `workbox-window` are present in dependencies, but `next.config.ts` contains no PWA configuration. 【F:package.json†L12-L51】【F:next.config.ts†L1-L10】
3. **Testing gap**: absence of test scripts implies no automated coverage for API and UI flows. 【F:package.json†L1-L19】
4. **Known TODOs**: README flags missing infra (permissions, calculations, validations, formatters, offline queue, UI components), some of which are now present in code (permissions, calculations, validations). This suggests README cleanup is needed. 【F:README.md†L171-L188】【F:src/lib/permissions.ts†L1-L95】【F:src/lib/calculations.ts†L1-L207】【F:src/lib/validations.ts†L1-L106】

## Recommendations

1. **Update the README** to reflect current layout and library coverage (Topbar/Sidebar/MobileNav are implemented; permissions/calculations/validations exist). 【F:README.md†L63-L76】【F:README.md†L171-L188】【F:src/components/layout/Topbar.tsx†L1-L260】【F:src/components/layout/Sidebar.tsx†L1-L397】【F:src/components/layout/MobileNav.tsx†L1-L233】【F:src/lib/permissions.ts†L1-L95】【F:src/lib/calculations.ts†L1-L207】【F:src/lib/validations.ts†L1-L106】
2. **Decide on PWA strategy**: either wire up `next-pwa` in `next.config.ts` or remove the dependency to reduce maintenance overhead. 【F:package.json†L12-L51】【F:next.config.ts†L1-L10】
3. **Introduce automated tests** (API unit tests and critical UI smoke tests) by adding a `test` script and a basic test runner configuration. 【F:package.json†L1-L19】
4. **Continue hardening production auth flows** by confirming RLS policies and database constraints noted as TODOs in the README. 【F:README.md†L189-L199】
