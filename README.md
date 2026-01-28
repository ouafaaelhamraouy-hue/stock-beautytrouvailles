# BeautyTrouvailles Stock Management System

Stock management system built with Next.js 15, React 19, TypeScript, MUI v6, Supabase, and Prisma.

## 📊 Project Status

**Current Phase:** Active Development

---

## ✅ Phase 1 - Foundation (COMPLETED)

### What Was Built

- **Next.js 15 Project** with App Router, TypeScript strict mode, src/ directory structure
- **Dependencies installed**: MUI v6 + MUI X, Supabase client/SSR, Prisma, React Hook Form, Zod, next-intl, and utilities
- **Environment configuration**: `.env` (for Prisma) and `.env.local` (for Next.js) with Supabase and database connection strings
- **Prisma Schema**: Complete database schema with users, products, categories, suppliers, shipments, sales, expenses, and settings tables
- **Database**: Migrations applied successfully, all tables created
- **MUI Theme Setup**: ThemeProvider with locale-aware theming (FR/EN) and App Router cache integration
- **Internationalization**: next-intl configured with French and English translations, locale routing under `[locale]`
- **Basic Pages**: Login page and Dashboard placeholder
- **Middleware**: Locale detection/routing + auth guard scaffold

### Project Structure

```
stock-beautytrouvailles/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── admin/create-admin/
│   │   │   └── user/profile/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── providers/
│   │       └── ThemeProvider.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useUserProfile.ts
│   ├── i18n/
│   │   ├── request.ts
│   │   └── routing.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   └── theme.ts
│   ├── middleware.ts
│   └── types/
│       └── supabase.ts
├── messages/
│   ├── en.json
│   └── fr.json
├── prisma/
│   └── schema.prisma
└── package.json
```

---

## ✅ Phase 2 - Authentication (COMPLETED)

### What Was Built

- **Supabase Auth Integration**: Server, client, and middleware clients configured
- **AuthProvider & useAuth Hook**: Context-based authentication state management
- **Login Page**: Fully functional with error handling and loading states
- **User Profile Management**: Auto-creates user profile in database on first login
- **API Endpoints**: `/api/user/profile` for fetching user data
- **Middleware Auth Guard**: Redirects unauthenticated users to login, authenticated users away from login
- **Role-Based Access**: Foundation in place (ADMIN/STAFF roles stored in database)
- **Logout Functionality**: Working with proper session cleanup

### Deliverables

- ✅ Login works
- ✅ Protected routes work
- ✅ User profile visible in dashboard
- ✅ Role stored in database

---

## ✅ Phase 3 - Layout Components (COMPLETED)

### What Exists

- ✅ Dashboard layout with responsive spacing and layout shell
- ✅ Sidebar navigation with menu items and collapse behavior
- ✅ Topbar with search, notifications, user menu, theme toggle, and locale switch
- ✅ MobileNav bottom bar (<768px) with Dashboard, Products, Quick Sale, Inventory, Menu

**Status:** Layout components are implemented and wired into the dashboard shell.

---

## Setting Up on Another Computer

### Option 1: Using Git (Recommended)

If you have the project in a Git repository:

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd stock-beautytrouvailles
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see below)

4. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

### Option 2: Copy Files Manually

If you don't use Git, copy these files/folders to the new computer:

**Copy these:**
- `src/` - Source code
- `prisma/` - Database schema
- `public/` - Static assets
- `messages/` - Translation files
- `scripts/` - Scripts folder
- `package.json` - Dependencies
- `package-lock.json` - Lock file
- `tsconfig.json` - TypeScript config
- `next.config.ts` - Next.js config
- `eslint.config.mjs` - ESLint config
- `README.md` - Documentation
- `.gitignore` - Git ignore rules

**Do NOT copy:**
- `node_modules/` - Will be regenerated
- `.next/` - Build output, will be regenerated
- `.env` - Contains sensitive data (create new)
- `.env.local` - Contains sensitive data (create new)

Then follow steps 2-5 from Option 1 above.

### Environment Variables Setup

You need to create two environment files on the new computer:

#### 1. Create `.env` file (for Prisma)

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"
```

**Where to get these:**
- Go to your Supabase project dashboard
- Navigate to Settings → Database
- Copy the Connection String (URI format)
- Use it for both `DATABASE_URL` and `DIRECT_URL`

#### 2. Create `.env.local` file (for Next.js)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to get these:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important:** Never commit these files to Git! They contain sensitive credentials.

### Prerequisites

Make sure you have installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

Check versions:
```bash
node --version  # Should be v18+
npm --version
```

## How to Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

4. **Run database migrations** (if needed):
   ```bash
   npm run db:push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - The app will automatically detect locale or use `/en` or `/fr`
   - Login at `/[locale]/login`
   - Dashboard at `/[locale]/dashboard`

### Troubleshooting

**Issue: "Cannot find module"**
- Delete `node_modules` and run `npm install` again

**Issue: "Database connection error"**
- Check that `.env` file has correct `DATABASE_URL`
- Verify your Supabase project is accessible
- Check if the password is URL-encoded in the connection string

**Issue: "Prisma Client not generated"**
- Run `npm run db:generate`

**Issue: "Port 3000 already in use"**
- Stop other applications using port 3000, or
- Run on a different port: `PORT=3001 npm run dev`

### Database Notes

- The database is hosted on Supabase, so it's shared across all computers
- All data (products, sales, shipments, etc.) is stored in the cloud
- User accounts are managed in Supabase Auth
- Changes made on one computer will be visible on all computers

---

## What Was Tested

- ✅ Project structure created correctly
- ✅ TypeScript strict mode enabled
- ✅ No Tailwind CSS (removed from configuration)
- ✅ Dependencies installed and working
- ✅ Database migrations applied successfully
- ✅ Authentication flow works
- ✅ Protected routes redirect correctly
- ✅ Dashboard loads with basic layout

---

## Known Issues / TODO

### Current Issues:
- ⚠️ **Database connection warnings**: Prisma sometimes tries old connection string format, but API handles gracefully with fallback

### Missing Infrastructure (Per Spec):
- ❌ `src/lib/format.ts` - Locale-aware formatting
- ❌ `src/lib/offlineQueue.ts` - PWA offline queue
- ❌ `src/components/ui/` - Reusable UI components (StatsCard, ErrorState, etc.)

### Database Integrity (Per Spec):
- ⚠️ Need to implement DB triggers for:
  - `quantitySold` and `quantityRemaining` auto-update
  - `Sale.totalAmount` validation
  - `Shipment.totalCostEUR` and `totalCostDH` auto-calculation
- ⚠️ Need to add RLS policies on all tables
- ⚠️ Need to add DB constraints (quantities >= 0, etc.)

### Next Steps:
- 📝 **Phase 4**: Build core UI components
- 📝 **Phase 5-15**: Continue with remaining phases

---

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)
- MUI v6 + MUI X (Data Grid, Charts, Date Pickers)
- Supabase (Auth + Postgres + Realtime)
- Prisma ORM
- React Hook Form + Zod
- next-intl (FR/EN)
- next-pwa + Workbox
- Utilities: xlsx, date-fns, numeral, sonner

---

## Documentation

All setup instructions are included in this README. For additional help, refer to the inline code comments and documentation.
