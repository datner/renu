/*
  Warnings:

  - You are about to drop the column `fulilled` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "fulilled",
ADD COLUMN     "fulfilled" BOOLEAN NOT NULL DEFAULT false;
