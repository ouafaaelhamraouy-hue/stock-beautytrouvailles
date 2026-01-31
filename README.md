# BeautyTrouvailles Stock Management System

Stock management system built with Next.js 15, React 19, TypeScript, MUI v6, Supabase, and Prisma.

## 📊 Project Status

**Current Phase:** Active Development (core modules implemented, UI/UX iterations ongoing)

---

## ✅ Highlights

- **Next.js 15 + App Router** with TypeScript strict mode
- **MUI v6 + MUI X** with custom design system and responsive layout
- **Supabase Auth** with profile bootstrap, org-scoped RBAC, and team management
- **Core modules**: Dashboard, Products, Inventory, Sales (Quick Sale), Shipments, Expenses
- **Products**: filters, stock status, import/export, adjustments, details panel
- **Internationalization**: next-intl (EN/FR) with locale routing
- **Theme system**: light / dark / system, cookie-persisted with early render sync
- **Dashboard charts**: Revenue vs Profit trend + Stock health

---

## Project Structure (abridged)

```
stock-beautytrouvailles/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (dashboard)/
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

## Theme & UI

- **Modes**: Light / Dark / System
- **Persistence**: `theme-mode` + `theme-resolved` cookies to avoid flash on first load
- **Toggle**: animated sliding switch in the topbar

---

## Development

### Scripts

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Lint
npm run check      # Lint + typecheck
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
npm run db:seed
```

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
SUPER_ADMIN_INVITE_EMAILS=owner1@example.com,owner2@example.com
# Optional (invite code gate for registration)
# NEXT_PUBLIC_INVITE_CODES=code1,code2
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

## Deployment (Vercel)

1. **Push to GitHub** (Vercel pulls from the repo)
2. **Create a Vercel project** and link the repository
3. **Set environment variables** in Vercel:
   - From `.env`: `DATABASE_URL`, `DIRECT_URL`
   - From `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Optional: `SUPER_ADMIN_INVITE_EMAILS`
4. **Apply database migrations**:
   ```bash
   npx prisma migrate deploy
   ```
   (Run once against the production database after the first deploy.)

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
- ✅ **Layout implemented**: sidebar, topbar, and mobile nav are in place

### Remaining Infrastructure:
- ⚠️ `src/lib/offlineQueue.ts` - PWA offline queue

### Database Integrity:
- ✅ Triggers, constraints, and RLS policies are included in the org migration

### Next Steps:
- 📝 **Offline queue** (PWA)
- 📝 **Optional**: expanded team invite UI + audit logs

---

## Tech Stack

- Next.js 15 (App Router)
- React 18
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
