-- Phase 8D.1.6: Unitization for existing tracked stock

-- Add unitization batch tracking to Unit table
ALTER TABLE "Unit" ADD COLUMN "unitizationBatchId" TEXT;

-- Create UnitizationBatch table
CREATE TABLE "UnitizationBatch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "countCreated" INTEGER NOT NULL,
    "reasonNote" TEXT,
    "performedByUserId" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitizationBatch_pkey" PRIMARY KEY ("id")
);

-- Create ShopTagCounter table
CREATE TABLE "ShopTagCounter" (
    "prefix" TEXT NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopTagCounter_pkey" PRIMARY KEY ("prefix")
);

-- Create indexes
CREATE INDEX "Unit_unitizationBatchId_idx" ON "Unit"("unitizationBatchId");

CREATE INDEX "UnitizationBatch_productId_locationId_createdAt_idx" ON "UnitizationBatch"("productId", "locationId", "createdAt");

-- Create unique constraint for unitization batches
ALTER TABLE "UnitizationBatch" ADD CONSTRAINT "UnitizationBatch_productId_locationId_performedAt_key" UNIQUE ("productId", "locationId", "performedAt");

-- Add foreign key constraints
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_unitizationBatchId_fkey" FOREIGN KEY ("unitizationBatchId") REFERENCES "UnitizationBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UnitizationBatch" ADD CONSTRAINT "UnitizationBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UnitizationBatch" ADD CONSTRAINT "UnitizationBatch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
