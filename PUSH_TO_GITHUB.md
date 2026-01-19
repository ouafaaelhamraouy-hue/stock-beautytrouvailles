# Push Project to GitHub - Step by Step Instructions

Follow these steps to push your project to GitHub and then clone it on another computer.

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and log in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `stock-beautytrouvailles` (or any name you prefer)
4. Description: "BeautyTrouvailles Stock Management System"
5. Choose **Private** or **Public**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Initialize Git and Push (Run these commands)

Open your terminal in the project folder and run:

```bash
# 1. Initialize git repository
git init

# 2. Add all files (respects .gitignore)
git add .

# 3. Create initial commit
git commit -m "Initial commit: BeautyTrouvailles Stock Management System

- Next.js 16 with App Router, React 19, TypeScript
- MUI v6 + MUI X (Data Grid, Charts, Date Pickers)
- Supabase Auth + Postgres + Realtime
- Prisma ORM
- Complete modules: Products, Categories, Suppliers, Shipments, Sales, Inventory, Expenses
- Dashboard with real-time stats and charts
- Full CRUD operations with role-based access control
- Internationalization (FR/EN)
- Responsive design with mobile navigation"

# 4. Rename branch to main (optional, GitHub default)
git branch -M main

# 5. Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/stock-beautytrouvailles.git

# 6. Push to GitHub
git push -u origin main
```

## Step 3: Clone on Another Computer

On your other computer, run:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/stock-beautytrouvailles.git

# Navigate into the project
cd stock-beautytrouvailles

# Install dependencies
npm install

# Create .env file with your database connection string
# (See README.md for details)

# Create .env.local file with your Supabase credentials
# (See README.md for details)

# Generate Prisma Client
npm run db:generate

# Run the development server
npm run dev
```

## Important Notes

### What's Included in Git:
✅ All source code (`src/`)
✅ Configuration files (`package.json`, `tsconfig.json`, etc.)
✅ Database schema (`prisma/schema.prisma`)
✅ Translation files (`messages/`)
✅ README.md

### What's NOT Included (by .gitignore):
❌ `node_modules/` - Will be regenerated with `npm install`
❌ `.next/` - Build output, regenerated on build
❌ `.env` - Sensitive database credentials (create new on each computer)
❌ `.env.local` - Sensitive Supabase credentials (create new on each computer)

### Environment Variables:
**You must create these files on each computer manually** because they contain sensitive credentials and are not tracked in Git.

1. **`.env`** - Database connection string from Supabase
2. **`.env.local`** - Supabase API credentials

See README.md for detailed instructions on getting these values from your Supabase dashboard.

## Troubleshooting

### If you get "authentication failed":
- Use a Personal Access Token instead of password
- Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- Use the token as your password when pushing

### If you get "remote origin already exists":
```bash
# Remove existing remote
git remote remove origin

# Add it again with correct URL
git remote add origin https://github.com/YOUR_USERNAME/stock-beautytrouvailles.git
```

### If you want to use SSH instead of HTTPS:
```bash
# Change remote URL to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/stock-beautytrouvailles.git
```

---

After pushing, you can clone this repository on any computer and continue working! 🚀
