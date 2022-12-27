-- DropIndex
DROP INDEX "Item_identifier_key";

-- CreateTable
CREATE TABLE "ItemModifier" (
    "id" SERIAL NOT NULL,
    "price" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "ItemModifier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemModifier" ADD CONSTRAINT "ItemModifier_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
