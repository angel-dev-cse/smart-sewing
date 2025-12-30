-- CreateTable
CREATE TABLE "UnitIdentityRevision" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "oldBrand" TEXT,
    "oldModel" TEXT,
    "oldManufacturerSerial" TEXT,
    "oldTagCode" TEXT,
    "oldUniqueSerialKey" TEXT,
    "newBrand" TEXT,
    "newModel" TEXT,
    "newManufacturerSerial" TEXT,
    "newTagCode" TEXT,
    "newUniqueSerialKey" TEXT,
    "changeReason" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitIdentityRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnitIdentityRevision_unitId_performedAt_idx" ON "UnitIdentityRevision"("unitId", "performedAt");

-- AddForeignKey
ALTER TABLE "UnitIdentityRevision" ADD CONSTRAINT "UnitIdentityRevision_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
