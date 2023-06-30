-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "paymentConfigId" INTEGER;

-- CreateTable
CREATE TABLE "PaymentConfig" (
    "id" SERIAL NOT NULL,
    "secretApiKey" TEXT NOT NULL,
    "publicApiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_paymentConfigId_fkey" FOREIGN KEY ("paymentConfigId") REFERENCES "PaymentConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
