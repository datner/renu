/*
  Warnings:

  - A unique constraint covering the columns `[identifier]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `identifier` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "identifier" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_identifier_key" ON "Organization"("identifier");
