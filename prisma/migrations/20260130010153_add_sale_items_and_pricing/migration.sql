-- DropForeignKey
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_saleId_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_productId_fkey";

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
