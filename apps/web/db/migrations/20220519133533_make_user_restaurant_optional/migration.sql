-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_restaurantId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "restaurantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
