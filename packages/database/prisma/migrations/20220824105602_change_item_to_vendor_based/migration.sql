-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_restaurantId_fkey";

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "restaurantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
