-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SalePricingMode" AS ENUM ('REGULAR', 'PROMO', 'CUSTOM', 'BUNDLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "sales"
  ALTER COLUMN "productId" DROP NOT NULL,
  ALTER COLUMN "quantity" DROP NOT NULL,
  ALTER COLUMN "pricePerUnit" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "pricingMode" "SalePricingMode" NOT NULL DEFAULT 'REGULAR',
  ADD COLUMN IF NOT EXISTS "bundleQty" INTEGER,
  ADD COLUMN IF NOT EXISTS "bundlePriceTotal" DECIMAL(10,2);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sale_items" (
  "id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "pricePerUnit" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sale_items_saleId_idx" ON "sale_items"("saleId");
CREATE INDEX IF NOT EXISTS "sale_items_productId_idx" ON "sale_items"("productId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "sale_items"
    ADD CONSTRAINT "sale_items_saleId_fkey"
    FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sale_items"
    ADD CONSTRAINT "sale_items_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
