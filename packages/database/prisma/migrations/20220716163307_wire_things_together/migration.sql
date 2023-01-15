-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "venueId" INTEGER;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "venueId" INTEGER;

-- AlterTable
ALTER TABLE "RestaurantI18L" ADD COLUMN     "venueId" INTEGER;

-- CreateTable
CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "identifier" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" TIMESTAMP(3),
    "organizationId" INTEGER NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MenuToVenue" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Venue_identifier_key" ON "Venue"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "_MenuToVenue_AB_unique" ON "_MenuToVenue"("A", "B");

-- CreateIndex
CREATE INDEX "_MenuToVenue_B_index" ON "_MenuToVenue"("B");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantI18L" ADD CONSTRAINT "RestaurantI18L_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuToVenue" ADD CONSTRAINT "_MenuToVenue_A_fkey" FOREIGN KEY ("A") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuToVenue" ADD CONSTRAINT "_MenuToVenue_B_fkey" FOREIGN KEY ("B") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
