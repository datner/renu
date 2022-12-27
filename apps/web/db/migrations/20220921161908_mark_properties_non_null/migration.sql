/*
  Warnings:

  - Made the column `itemModifierId` on table `OrderItemModifier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount` on table `OrderItemModifier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `OrderItemModifier` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "OrderItemModifier" DROP CONSTRAINT "OrderItemModifier_itemModifierId_fkey";

-- AlterTable
ALTER TABLE "OrderItemModifier" ALTER COLUMN "itemModifierId" SET NOT NULL,
ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "price" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_itemModifierId_fkey" FOREIGN KEY ("itemModifierId") REFERENCES "ItemModifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
