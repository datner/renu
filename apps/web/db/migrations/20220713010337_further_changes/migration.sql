/*
  Warnings:

  - You are about to drop the `Bon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bon" DROP CONSTRAINT "Bon_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_bonId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropIndex
DROP INDEX "Category_identifier_key";

-- DropIndex
DROP INDEX "Menu_identifier_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "organizationId" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "organizationId" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "organizationId" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Bon";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "OrderItem";
