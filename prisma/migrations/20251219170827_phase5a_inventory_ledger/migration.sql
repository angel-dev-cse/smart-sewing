/*
  Warnings:

  - A unique constraint covering the columns `[refType,refId,productId,kind]` on the table `InventoryMovement` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_productId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_refType_refId_productId_kind_key" ON "InventoryMovement"("refType", "refId", "productId", "kind");

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
