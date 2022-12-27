/*
  Warnings:

  - You are about to drop the column `simpleAddress` on the `Venue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Venue" DROP COLUMN "simpleAddress",
ADD COLUMN     "simpleContactInfo" TEXT;
