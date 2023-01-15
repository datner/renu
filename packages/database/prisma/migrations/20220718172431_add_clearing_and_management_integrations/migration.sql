-- CreateEnum
CREATE TYPE "ClearingProvider" AS ENUM ('CREDIT_GUARD');

-- CreateEnum
CREATE TYPE "ManagementProvider" AS ENUM ('DORIX');

-- CreateTable
CREATE TABLE "ClearingIntegration" (
    "id" SERIAL NOT NULL,
    "provider" "ClearingProvider" NOT NULL,
    "terminal" INTEGER NOT NULL,
    "venueId" INTEGER NOT NULL,

    CONSTRAINT "ClearingIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClearingProfile" (
    "provider" "ClearingProvider" NOT NULL,
    "vendorData" JSONB NOT NULL,

    CONSTRAINT "ClearingProfile_pkey" PRIMARY KEY ("provider")
);

-- CreateTable
CREATE TABLE "ManagementIntegration" (
    "id" SERIAL NOT NULL,
    "provider" "ManagementProvider" NOT NULL,
    "venueId" INTEGER NOT NULL,

    CONSTRAINT "ManagementIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagementProfile" (
    "provider" "ManagementProvider" NOT NULL,
    "vendorData" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ClearingIntegration_venueId_key" ON "ClearingIntegration"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagementIntegration_venueId_key" ON "ManagementIntegration"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagementProfile_provider_key" ON "ManagementProfile"("provider");

-- AddForeignKey
ALTER TABLE "ClearingIntegration" ADD CONSTRAINT "ClearingIntegration_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementIntegration" ADD CONSTRAINT "ManagementIntegration_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
