-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "bonId" INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "comment" TEXT NOT NULL DEFAULT E'';

-- CreateTable
CREATE TABLE "Bon" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "table" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "lifespan" INTEGER NOT NULL,

    CONSTRAINT "Bon_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "Bon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bon" ADD CONSTRAINT "Bon_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
