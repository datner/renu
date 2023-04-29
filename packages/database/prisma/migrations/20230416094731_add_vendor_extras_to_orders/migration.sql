-- AlterEnum
ALTER TYPE "ManagementProvider" ADD VALUE 'PRESTO';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "clearingExtra" JSONB,
ADD COLUMN     "managementExtra" JSONB;
