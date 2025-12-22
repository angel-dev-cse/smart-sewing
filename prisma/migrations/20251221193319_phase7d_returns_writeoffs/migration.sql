-- CreateEnum
CREATE TYPE "SalesReturnStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseReturnStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WriteOffStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SalesReturn" (
    "id" TEXT NOT NULL,
    "returnNo" INTEGER NOT NULL,
    "status" "SalesReturnStatus" NOT NULL DEFAULT 'ISSUED',
    "salesInvoiceId" TEXT,
    "partyId" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturnItem" (
    "id" TEXT NOT NULL,
    "salesReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturnRefund" (
    "id" TEXT NOT NULL,
    "salesReturnId" TEXT NOT NULL,
    "method" "PurchasePaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ledgerEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesReturnRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturn" (
    "id" TEXT NOT NULL,
    "returnNo" INTEGER NOT NULL,
    "status" "PurchaseReturnStatus" NOT NULL DEFAULT 'ISSUED',
    "purchaseBillId" TEXT,
    "partyId" TEXT,
    "supplierName" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnItem" (
    "id" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnRefund" (
    "id" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "method" "PurchasePaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ledgerEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseReturnRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WriteOff" (
    "id" TEXT NOT NULL,
    "writeOffNo" INTEGER NOT NULL,
    "status" "WriteOffStatus" NOT NULL DEFAULT 'ISSUED',
    "reason" TEXT,
    "notes" TEXT,
    "totalValue" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WriteOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WriteOffItem" (
    "id" TEXT NOT NULL,
    "writeOffId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "unitValue" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WriteOffItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesReturn_returnNo_key" ON "SalesReturn"("returnNo");

-- CreateIndex
CREATE INDEX "SalesReturn_status_createdAt_idx" ON "SalesReturn"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SalesReturn_returnNo_idx" ON "SalesReturn"("returnNo");

-- CreateIndex
CREATE INDEX "SalesReturn_partyId_idx" ON "SalesReturn"("partyId");

-- CreateIndex
CREATE INDEX "SalesReturn_salesInvoiceId_idx" ON "SalesReturn"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "SalesReturnItem_salesReturnId_idx" ON "SalesReturnItem"("salesReturnId");

-- CreateIndex
CREATE INDEX "SalesReturnItem_productId_idx" ON "SalesReturnItem"("productId");

-- CreateIndex
CREATE INDEX "SalesReturnRefund_salesReturnId_paidAt_idx" ON "SalesReturnRefund"("salesReturnId", "paidAt");

-- CreateIndex
CREATE INDEX "SalesReturnRefund_ledgerEntryId_idx" ON "SalesReturnRefund"("ledgerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturn_returnNo_key" ON "PurchaseReturn"("returnNo");

-- CreateIndex
CREATE INDEX "PurchaseReturn_status_createdAt_idx" ON "PurchaseReturn"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseReturn_returnNo_idx" ON "PurchaseReturn"("returnNo");

-- CreateIndex
CREATE INDEX "PurchaseReturn_partyId_idx" ON "PurchaseReturn"("partyId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_purchaseBillId_idx" ON "PurchaseReturn"("purchaseBillId");

-- CreateIndex
CREATE INDEX "PurchaseReturnItem_purchaseReturnId_idx" ON "PurchaseReturnItem"("purchaseReturnId");

-- CreateIndex
CREATE INDEX "PurchaseReturnItem_productId_idx" ON "PurchaseReturnItem"("productId");

-- CreateIndex
CREATE INDEX "PurchaseReturnRefund_purchaseReturnId_paidAt_idx" ON "PurchaseReturnRefund"("purchaseReturnId", "paidAt");

-- CreateIndex
CREATE INDEX "PurchaseReturnRefund_ledgerEntryId_idx" ON "PurchaseReturnRefund"("ledgerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "WriteOff_writeOffNo_key" ON "WriteOff"("writeOffNo");

-- CreateIndex
CREATE INDEX "WriteOff_status_createdAt_idx" ON "WriteOff"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WriteOff_writeOffNo_idx" ON "WriteOff"("writeOffNo");

-- CreateIndex
CREATE INDEX "WriteOffItem_writeOffId_idx" ON "WriteOffItem"("writeOffId");

-- CreateIndex
CREATE INDEX "WriteOffItem_productId_idx" ON "WriteOffItem"("productId");

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnRefund" ADD CONSTRAINT "SalesReturnRefund_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnRefund" ADD CONSTRAINT "SalesReturnRefund_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_purchaseBillId_fkey" FOREIGN KEY ("purchaseBillId") REFERENCES "PurchaseBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnItem" ADD CONSTRAINT "PurchaseReturnItem_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnItem" ADD CONSTRAINT "PurchaseReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnRefund" ADD CONSTRAINT "PurchaseReturnRefund_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnRefund" ADD CONSTRAINT "PurchaseReturnRefund_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriteOffItem" ADD CONSTRAINT "WriteOffItem_writeOffId_fkey" FOREIGN KEY ("writeOffId") REFERENCES "WriteOff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriteOffItem" ADD CONSTRAINT "WriteOffItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
