/*
  Warnings:

  - You are about to drop the column `managementRepresentation` on the `OrderItemModifier` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderItemModifier" DROP CONSTRAINT "OrderItemModifier_itemModifierId_fkey";

-- AlterTable
ALTER TABLE "ItemModifier" ADD COLUMN     "managementRepresentation" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "OrderItemModifier" DROP COLUMN "managementRepresentation",
ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "price" INTEGER,
ALTER COLUMN "itemModifierId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_OrderItemToOrderItemModifier" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrderItemToOrderItemModifier_AB_unique" ON "_OrderItemToOrderItemModifier"("A", "B");

-- CreateIndex
CREATE INDEX "_OrderItemToOrderItemModifier_B_index" ON "_OrderItemToOrderItemModifier"("B");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_itemModifierId_fkey" FOREIGN KEY ("itemModifierId") REFERENCES "ItemModifier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderItemToOrderItemModifier" ADD CONSTRAINT "_OrderItemToOrderItemModifier_A_fkey" FOREIGN KEY ("A") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderItemToOrderItemModifier" ADD CONSTRAINT "_OrderItemToOrderItemModifier_B_fkey" FOREIGN KEY ("B") REFERENCES "OrderItemModifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
