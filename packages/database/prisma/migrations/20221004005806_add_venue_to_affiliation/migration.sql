/*
  Warnings:

  - Added the required column `venueId` to the `Affiliation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Affiliation" ADD COLUMN     "venueId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Affiliation" ADD CONSTRAINT "Affiliation_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
