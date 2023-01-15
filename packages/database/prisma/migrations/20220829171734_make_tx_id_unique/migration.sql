/*
  Warnings:

  - A unique constraint covering the columns `[txId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_txId_key" ON "Order"("txId");
