/*
  Warnings:

  - You are about to drop the column `organizationId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "organizationId";

-- CreateTable
CREATE TABLE "Affiliation" (
    "id" SERIAL NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Affiliation" ADD CONSTRAINT "Affiliation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliation" ADD CONSTRAINT "Affiliation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
