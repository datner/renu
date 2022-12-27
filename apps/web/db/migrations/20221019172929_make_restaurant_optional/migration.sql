-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_restaurantId_fkey";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "restaurantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
