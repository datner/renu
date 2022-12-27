/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,identifier]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Item_restaurantId_identifier_key";

-- CreateIndex
CREATE UNIQUE INDEX "Item_organizationId_identifier_key" ON "Item"("organizationId", "identifier");
