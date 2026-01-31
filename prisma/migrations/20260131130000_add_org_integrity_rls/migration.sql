-- Organization + integrity + RLS

-- Ensure pgcrypto for random UUIDs (used for default org id)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_name_key" ON "organizations"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key" ON "organizations"("slug");

-- Add organizationId columns (nullable for backfill)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "arrivages" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Drop org-agnostic unique indexes so we can scope uniqueness per organization
DROP INDEX IF EXISTS "categories_name_key";
DROP INDEX IF EXISTS "brands_name_key";
DROP INDEX IF EXISTS "arrivages_reference_key";
DROP INDEX IF EXISTS "settings_key_key";

-- Backfill default organization and link existing rows
DO $$
DECLARE
  org_id TEXT;
BEGIN
  SELECT "id" INTO org_id FROM "organizations" WHERE "slug" = 'beautytrouvailles' LIMIT 1;
  IF org_id IS NULL THEN
    org_id := 'org_' || REPLACE(gen_random_uuid()::text, '-', '');
    INSERT INTO "organizations" ("id", "name", "slug")
    VALUES (org_id, 'BeautyTrouvailles', 'beautytrouvailles')
    ON CONFLICT ("slug") DO NOTHING;
    SELECT "id" INTO org_id FROM "organizations" WHERE "slug" = 'beautytrouvailles' LIMIT 1;
  END IF;

  UPDATE "users" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "categories" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "brands" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "products" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "arrivages" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "sales" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "sale_items" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "expenses" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "stock_movements" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
  UPDATE "settings" SET "organizationId" = org_id WHERE "organizationId" IS NULL;
END $$;

-- Enforce NOT NULL after backfill
ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "brands" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "arrivages" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "sale_items" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "stock_movements" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "organizationId" SET NOT NULL;

-- Foreign keys
ALTER TABLE "users"
  ADD CONSTRAINT "users_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "categories"
  ADD CONSTRAINT "categories_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "brands"
  ADD CONSTRAINT "brands_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products"
  ADD CONSTRAINT "products_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "arrivages"
  ADD CONSTRAINT "arrivages_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sale_items"
  ADD CONSTRAINT "sale_items_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "settings"
  ADD CONSTRAINT "settings_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "users_organizationId_idx" ON "users"("organizationId");
CREATE INDEX IF NOT EXISTS "categories_organizationId_idx" ON "categories"("organizationId");
CREATE INDEX IF NOT EXISTS "brands_organizationId_idx" ON "brands"("organizationId");
CREATE INDEX IF NOT EXISTS "products_organizationId_idx" ON "products"("organizationId");
CREATE INDEX IF NOT EXISTS "arrivages_organizationId_idx" ON "arrivages"("organizationId");
CREATE INDEX IF NOT EXISTS "sales_organizationId_idx" ON "sales"("organizationId");
CREATE INDEX IF NOT EXISTS "sale_items_organizationId_idx" ON "sale_items"("organizationId");
CREATE INDEX IF NOT EXISTS "expenses_organizationId_idx" ON "expenses"("organizationId");
CREATE INDEX IF NOT EXISTS "stock_movements_organizationId_idx" ON "stock_movements"("organizationId");
CREATE INDEX IF NOT EXISTS "settings_organizationId_idx" ON "settings"("organizationId");

-- Composite unique indexes scoped to organization
CREATE UNIQUE INDEX IF NOT EXISTS "categories_org_name_key" ON "categories"("organizationId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "brands_org_name_key" ON "brands"("organizationId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "arrivages_org_reference_key" ON "arrivages"("organizationId", "reference");
CREATE UNIQUE INDEX IF NOT EXISTS "settings_org_key_key" ON "settings"("organizationId", "key");

-- Constraints (non-negative quantities and costs)
ALTER TABLE "products" ADD CONSTRAINT "products_quantityReceived_nonneg" CHECK ("quantityReceived" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_quantitySold_nonneg" CHECK ("quantitySold" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_reorderLevel_nonneg" CHECK ("reorderLevel" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_purchasePriceMad_nonneg" CHECK ("purchasePriceMad" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_sellingPriceDh_nonneg" CHECK ("sellingPriceDh" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_promoPriceDh_nonneg" CHECK ("promoPriceDh" IS NULL OR "promoPriceDh" >= 0);

ALTER TABLE "sales" ADD CONSTRAINT "sales_totalAmount_nonneg" CHECK ("totalAmount" >= 0);
ALTER TABLE "sales" ADD CONSTRAINT "sales_quantity_nonneg" CHECK ("quantity" IS NULL OR "quantity" >= 0);
ALTER TABLE "sales" ADD CONSTRAINT "sales_pricePerUnit_nonneg" CHECK ("pricePerUnit" IS NULL OR "pricePerUnit" >= 0);
ALTER TABLE "sales" ADD CONSTRAINT "sales_bundleQty_nonneg" CHECK ("bundleQty" IS NULL OR "bundleQty" >= 0);
ALTER TABLE "sales" ADD CONSTRAINT "sales_bundlePriceTotal_nonneg" CHECK ("bundlePriceTotal" IS NULL OR "bundlePriceTotal" >= 0);

ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_quantity_nonneg" CHECK ("quantity" >= 0);
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_pricePerUnit_nonneg" CHECK ("pricePerUnit" >= 0);

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amountEUR_nonneg" CHECK ("amountEUR" >= 0);
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amountDH_nonneg" CHECK ("amountDH" >= 0);

ALTER TABLE "arrivages" ADD CONSTRAINT "arrivages_exchangeRate_positive" CHECK ("exchangeRate" > 0);
ALTER TABLE "arrivages" ADD CONSTRAINT "arrivages_totalCostEur_nonneg" CHECK ("totalCostEur" >= 0);
ALTER TABLE "arrivages" ADD CONSTRAINT "arrivages_totalCostDh_nonneg" CHECK ("totalCostDh" >= 0);
ALTER TABLE "arrivages" ADD CONSTRAINT "arrivages_shippingCostEur_nonneg" CHECK ("shippingCostEur" >= 0);
ALTER TABLE "arrivages" ADD CONSTRAINT "arrivages_packagingCostEur_nonneg" CHECK ("packagingCostEur" >= 0);
ALTER TABLE "arrivages" ADD CONSTRAINT "arrivages_productCount_nonneg" CHECK ("productCount" >= 0);
ALTER TABLE "arrivages" ADD CONSTRAINT "arrivages_totalUnits_nonneg" CHECK ("totalUnits" >= 0);

-- Trigger: sale total for single-product sales
CREATE OR REPLACE FUNCTION public.set_sale_total_amount() RETURNS trigger AS $$
BEGIN
  IF NEW."productId" IS NOT NULL AND NEW."quantity" IS NOT NULL AND NEW."pricePerUnit" IS NOT NULL THEN
    NEW."totalAmount" := ROUND((NEW."quantity" * NEW."pricePerUnit")::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sale_total_amount_before ON "sales";
CREATE TRIGGER sale_total_amount_before
BEFORE INSERT OR UPDATE ON "sales"
FOR EACH ROW EXECUTE FUNCTION public.set_sale_total_amount();

-- Trigger: sale items update sale totals for bundles
CREATE OR REPLACE FUNCTION public.sync_sale_totals_from_items() RETURNS trigger AS $$
DECLARE
  target_sale_id TEXT;
  total NUMERIC;
BEGIN
  target_sale_id := COALESCE(NEW."saleId", OLD."saleId");
  IF target_sale_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM("quantity" * "pricePerUnit"), 0)
    INTO total
    FROM "sale_items"
   WHERE "saleId" = target_sale_id;

  UPDATE "sales"
     SET "totalAmount" = ROUND(total::numeric, 2),
         "bundlePriceTotal" = ROUND(total::numeric, 2)
   WHERE "id" = target_sale_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sale_items_total_after ON "sale_items";
CREATE TRIGGER sale_items_total_after
AFTER INSERT OR UPDATE OR DELETE ON "sale_items"
FOR EACH ROW EXECUTE FUNCTION public.sync_sale_totals_from_items();

-- Trigger: adjust product quantitySold for single sales
CREATE OR REPLACE FUNCTION public.adjust_product_quantity_sold_from_sales() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."productId" IS NOT NULL AND NEW."quantity" IS NOT NULL THEN
      UPDATE "products" SET "quantitySold" = "quantitySold" + NEW."quantity" WHERE "id" = NEW."productId";
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD."productId" IS NOT NULL AND OLD."quantity" IS NOT NULL THEN
      UPDATE "products" SET "quantitySold" = "quantitySold" - OLD."quantity" WHERE "id" = OLD."productId";
    END IF;
    IF NEW."productId" IS NOT NULL AND NEW."quantity" IS NOT NULL THEN
      UPDATE "products" SET "quantitySold" = "quantitySold" + NEW."quantity" WHERE "id" = NEW."productId";
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD."productId" IS NOT NULL AND OLD."quantity" IS NOT NULL THEN
      UPDATE "products" SET "quantitySold" = "quantitySold" - OLD."quantity" WHERE "id" = OLD."productId";
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sales_quantity_sold_after ON "sales";
CREATE TRIGGER sales_quantity_sold_after
AFTER INSERT OR UPDATE OR DELETE ON "sales"
FOR EACH ROW EXECUTE FUNCTION public.adjust_product_quantity_sold_from_sales();

-- Trigger: adjust product quantitySold for bundle items
CREATE OR REPLACE FUNCTION public.adjust_product_quantity_sold_from_items() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "products" SET "quantitySold" = "quantitySold" + NEW."quantity" WHERE "id" = NEW."productId";
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE "products" SET "quantitySold" = "quantitySold" - OLD."quantity" WHERE "id" = OLD."productId";
    UPDATE "products" SET "quantitySold" = "quantitySold" + NEW."quantity" WHERE "id" = NEW."productId";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "products" SET "quantitySold" = "quantitySold" - OLD."quantity" WHERE "id" = OLD."productId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sale_items_quantity_sold_after ON "sale_items";
CREATE TRIGGER sale_items_quantity_sold_after
AFTER INSERT OR UPDATE OR DELETE ON "sale_items"
FOR EACH ROW EXECUTE FUNCTION public.adjust_product_quantity_sold_from_items();

-- Trigger: arrivage totals
CREATE OR REPLACE FUNCTION public.set_arrivage_totals() RETURNS trigger AS $$
BEGIN
  IF NEW."totalCostEur" IS NULL THEN
    NEW."totalCostEur" := COALESCE(NEW."shippingCostEur", 0) + COALESCE(NEW."packagingCostEur", 0);
  END IF;
  IF NEW."exchangeRate" IS NOT NULL THEN
    NEW."totalCostDh" := ROUND((NEW."totalCostEur" * NEW."exchangeRate")::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS arrivage_totals_before ON "arrivages";
CREATE TRIGGER arrivage_totals_before
BEFORE INSERT OR UPDATE ON "arrivages"
FOR EACH ROW EXECUTE FUNCTION public.set_arrivage_totals();

-- RLS helper
CREATE OR REPLACE FUNCTION public.current_org_id() RETURNS TEXT AS $$
  SELECT "organizationId"
  FROM "users"
  WHERE "id" = current_setting('request.jwt.claim.sub', true)
$$ LANGUAGE sql STABLE;

-- Enable RLS
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "arrivages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;

-- Policies (same-org access)
CREATE POLICY "org_select" ON "organizations"
  FOR SELECT USING ("id" = public.current_org_id());

CREATE POLICY "users_org_access" ON "users"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "categories_org_access" ON "categories"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "brands_org_access" ON "brands"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "products_org_access" ON "products"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "arrivages_org_access" ON "arrivages"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "sales_org_access" ON "sales"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "sale_items_org_access" ON "sale_items"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "expenses_org_access" ON "expenses"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "stock_movements_org_access" ON "stock_movements"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());

CREATE POLICY "settings_org_access" ON "settings"
  FOR ALL USING ("organizationId" = public.current_org_id())
  WITH CHECK ("organizationId" = public.current_org_id());
