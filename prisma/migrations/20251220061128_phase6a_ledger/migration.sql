-- CreateEnum
CREATE TYPE "LedgerAccountKind" AS ENUM ('CASH', 'BKASH', 'NAGAD', 'BANK');

-- CreateEnum
CREATE TYPE "LedgerCategoryKind" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "LedgerEntryDirection" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "LedgerAccountKind" NOT NULL,
    "openingBalance" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "LedgerCategoryKind" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "direction" "LedgerEntryDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refType" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_name_key" ON "LedgerAccount"("name");

-- CreateIndex
CREATE INDEX "LedgerAccount_kind_isActive_idx" ON "LedgerAccount"("kind", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerCategory_name_key" ON "LedgerCategory"("name");

-- CreateIndex
CREATE INDEX "LedgerCategory_kind_isActive_idx" ON "LedgerCategory"("kind", "isActive");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_occurredAt_idx" ON "LedgerEntry"("accountId", "occurredAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_categoryId_occurredAt_idx" ON "LedgerEntry"("categoryId", "occurredAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_refType_refId_idx" ON "LedgerEntry"("refType", "refId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LedgerCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
