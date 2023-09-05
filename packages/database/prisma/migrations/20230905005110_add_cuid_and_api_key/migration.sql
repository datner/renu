/*
  Warnings:

  - A unique constraint covering the columns `[cuid]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cuid]` on the table `Venue` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cuid" TEXT;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "cuid" TEXT;

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "associatedWith" TEXT NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_hash_key" ON "ApiKey"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Order_cuid_key" ON "Order"("cuid");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_cuid_key" ON "Venue"("cuid");
