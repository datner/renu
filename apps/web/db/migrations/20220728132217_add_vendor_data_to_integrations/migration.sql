-- AlterTable
ALTER TABLE "ClearingIntegration" ADD COLUMN     "vendorData" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- AlterTable
ALTER TABLE "ManagementIntegration" ADD COLUMN     "vendorData" JSONB NOT NULL DEFAULT '{}'::jsonb;
