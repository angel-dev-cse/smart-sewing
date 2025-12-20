-- CreateEnum
CREATE TYPE "RentalContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RentalBillStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RentalBillPaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateTable
CREATE TABLE "RentalContract" (
    "id" TEXT NOT NULL,
    "contractNo" INTEGER NOT NULL,
    "status" "RentalContractStatus" NOT NULL DEFAULT 'DRAFT',
    "customerName" TEXT NOT NULL,
    "phone" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "deposit" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalContractItem" (
    "id" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "monthlyRate" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalContractItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalBill" (
    "id" TEXT NOT NULL,
    "billNo" INTEGER NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "status" "RentalBillStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "RentalBillPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalBillItem" (
    "id" TEXT NOT NULL,
    "rentalBillId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "monthlyRate" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RentalContract_contractNo_key" ON "RentalContract"("contractNo");

-- CreateIndex
CREATE INDEX "RentalContract_status_createdAt_idx" ON "RentalContract"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RentalContract_contractNo_idx" ON "RentalContract"("contractNo");

-- CreateIndex
CREATE INDEX "RentalContractItem_rentalContractId_idx" ON "RentalContractItem"("rentalContractId");

-- CreateIndex
CREATE INDEX "RentalContractItem_productId_idx" ON "RentalContractItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalBill_billNo_key" ON "RentalBill"("billNo");

-- CreateIndex
CREATE INDEX "RentalBill_rentalContractId_createdAt_idx" ON "RentalBill"("rentalContractId", "createdAt");

-- CreateIndex
CREATE INDEX "RentalBill_status_createdAt_idx" ON "RentalBill"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RentalBill_billNo_idx" ON "RentalBill"("billNo");

-- CreateIndex
CREATE INDEX "RentalBillItem_rentalBillId_idx" ON "RentalBillItem"("rentalBillId");

-- CreateIndex
CREATE INDEX "RentalBillItem_productId_idx" ON "RentalBillItem"("productId");

-- AddForeignKey
ALTER TABLE "RentalContractItem" ADD CONSTRAINT "RentalContractItem_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalContractItem" ADD CONSTRAINT "RentalContractItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBill" ADD CONSTRAINT "RentalBill_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBillItem" ADD CONSTRAINT "RentalBillItem_rentalBillId_fkey" FOREIGN KEY ("rentalBillId") REFERENCES "RentalBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBillItem" ADD CONSTRAINT "RentalBillItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
