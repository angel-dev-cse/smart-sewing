/*
  Warnings:

  - A unique constraint covering the columns `[salesInvoiceId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "salesInvoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_salesInvoiceId_key" ON "Order"("salesInvoiceId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
