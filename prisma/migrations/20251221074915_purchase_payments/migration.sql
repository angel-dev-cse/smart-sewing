-- CreateEnum
CREATE TYPE "PurchasePaymentMethod" AS ENUM ('CASH', 'BKASH', 'NAGAD', 'BANK');

-- CreateTable
CREATE TABLE "PurchasePayment" (
    "id" TEXT NOT NULL,
    "purchaseBillId" TEXT NOT NULL,
    "method" "PurchasePaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ledgerEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchasePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchasePayment_purchaseBillId_paidAt_idx" ON "PurchasePayment"("purchaseBillId", "paidAt");

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_purchaseBillId_fkey" FOREIGN KEY ("purchaseBillId") REFERENCES "PurchaseBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
