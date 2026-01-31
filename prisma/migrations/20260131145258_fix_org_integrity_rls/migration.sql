-- DropIndex
DROP INDEX "settings_organizationId_idx";

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "arrivages_org_reference_key" RENAME TO "arrivages_organizationId_reference_key";

-- RenameIndex
ALTER INDEX "brands_org_name_key" RENAME TO "brands_organizationId_name_key";

-- RenameIndex
ALTER INDEX "categories_org_name_key" RENAME TO "categories_organizationId_name_key";

-- RenameIndex
ALTER INDEX "settings_org_key_key" RENAME TO "settings_organizationId_key_key";
