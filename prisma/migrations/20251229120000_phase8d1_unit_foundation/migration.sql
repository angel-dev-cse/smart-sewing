-- Phase 8D.1: Unit foundation + product tracking flags + serial policy

-- Add product tracking flags
ALTER TABLE "Product" ADD COLUMN "isAssetTracked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "serialRequired" BOOLEAN NOT NULL DEFAULT false;

-- Create enums
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'CUSTOMER_OWNED', 'RENTED_IN');

CREATE TYPE "UnitStatus" AS ENUM (
  'AVAILABLE',
  'IN_SERVICE',
  'IDLE_AT_CUSTOMER',
  'RENTED_OUT',
  'RENTED_IN_ACTIVE',
  'SOLD',
  'SCRAPPED',
  'RETURNED_TO_SUPPLIER',
  'RETURNED_TO_CUSTOMER'
);

-- Create Unit table
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "ownershipType" "OwnershipType" NOT NULL,
    "productId" TEXT,
    "manufacturerSerial" TEXT,
    "uniqueSerialKey" TEXT,
    "tagCode" TEXT,
    "ownerPartyId" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentLocationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "Unit_uniqueSerialKey_key" ON "Unit"("uniqueSerialKey");
CREATE INDEX "Unit_productId_idx" ON "Unit"("productId");
CREATE INDEX "Unit_ownerPartyId_idx" ON "Unit"("ownerPartyId");
CREATE INDEX "Unit_ownershipType_status_idx" ON "Unit"("ownershipType", "status");
CREATE INDEX "Unit_currentLocationId_idx" ON "Unit"("currentLocationId");

-- Add foreign key constraints
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_ownerPartyId_fkey" FOREIGN KEY ("ownerPartyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
