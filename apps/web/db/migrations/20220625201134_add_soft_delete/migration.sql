-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleted" TIMESTAMP(3);
