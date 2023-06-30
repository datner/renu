/*
  Warnings:

  - Made the column `appId` on table `PaymentConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PaymentConfig" ALTER COLUMN "appId" SET NOT NULL;
