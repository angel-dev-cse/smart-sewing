-- CreateEnum
CREATE TYPE "PurchaseBillStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PurchaseBill" (
    "id" TEXT NOT NULL,
    "billNo" INTEGER NOT NULL,
    "status" "PurchaseBillStatus" NOT NULL DEFAULT 'DRAFT',
    "supplierName" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseBillItem" (
    "id" TEXT NOT NULL,
    "purchaseBillId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseBill_billNo_key" ON "PurchaseBill"("billNo");

-- CreateIndex
CREATE INDEX "PurchaseBill_status_createdAt_idx" ON "PurchaseBill"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseBill_billNo_idx" ON "PurchaseBill"("billNo");

-- CreateIndex
CREATE INDEX "PurchaseBillItem_purchaseBillId_idx" ON "PurchaseBillItem"("purchaseBillId");

-- CreateIndex
CREATE INDEX "PurchaseBillItem_productId_idx" ON "PurchaseBillItem"("productId");

-- AddForeignKey
ALTER TABLE "PurchaseBillItem" ADD CONSTRAINT "PurchaseBillItem_purchaseBillId_fkey" FOREIGN KEY ("purchaseBillId") REFERENCES "PurchaseBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBillItem" ADD CONSTRAINT "PurchaseBillItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
