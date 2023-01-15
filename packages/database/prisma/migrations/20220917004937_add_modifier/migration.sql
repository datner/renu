-- CreateTable
CREATE TABLE "OrderItemModifier" (
    "id" SERIAL NOT NULL,
    "itemModifierId" INTEGER NOT NULL,
    "choice" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "managementRepresentation" JSONB NOT NULL,

    CONSTRAINT "OrderItemModifier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_itemModifierId_fkey" FOREIGN KEY ("itemModifierId") REFERENCES "ItemModifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
