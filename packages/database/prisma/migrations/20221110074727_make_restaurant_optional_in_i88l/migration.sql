-- DropForeignKey
ALTER TABLE "RestaurantI18L" DROP CONSTRAINT "RestaurantI18L_restaurantId_fkey";

-- AlterTable
ALTER TABLE "RestaurantI18L" ALTER COLUMN "restaurantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RestaurantI18L" ADD CONSTRAINT "RestaurantI18L_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
