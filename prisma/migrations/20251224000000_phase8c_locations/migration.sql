-- Phase 8C.1: Locations / Warehouses foundation

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");
CREATE INDEX "Location_isActive_idx" ON "Location"("isActive");
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN "fromLocationId" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN "toLocationId" TEXT;

-- CreateIndex
CREATE INDEX "InventoryMovement_fromLocationId_createdAt_idx" ON "InventoryMovement"("fromLocationId", "createdAt");
CREATE INDEX "InventoryMovement_toLocationId_createdAt_idx" ON "InventoryMovement"("toLocationId", "createdAt");

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default locations (id is stable string; Prisma can still create cuid() ids for user-added locations)
INSERT INTO "Location" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES ('loc_shop', 'SHOP', 'Shop', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Location" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES ('loc_warehouse', 'WAREHOUSE', 'Warehouse', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Location" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES ('loc_service', 'SERVICE', 'Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
