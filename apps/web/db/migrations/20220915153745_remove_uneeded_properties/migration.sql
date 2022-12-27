/*
  Warnings:

  - You are about to drop the column `price` on the `ItemModifier` table. All the data in the column will be lost.
  - Added the required column `config` to the `ItemModifier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `ItemModifier` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ModifierType" AS ENUM ('ONE_OF', 'EXTRAS', 'QUERY', 'SLIDER', 'OPTIONS');

-- AlterTable
ALTER TABLE "ItemModifier" DROP COLUMN "price",
ADD COLUMN     "config" JSONB NOT NULL,
ADD COLUMN     "position" INTEGER NOT NULL;
