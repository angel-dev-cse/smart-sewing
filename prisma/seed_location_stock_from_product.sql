-- One-time backfill: assume existing Product.stock is currently in SHOP.
-- Safe: only inserts missing (locationId, productId) pairs.

-- Ensure default locations exist (if they already exist, this does nothing useful and is safe)
INSERT INTO "Location" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES ('loc_shop', 'SHOP', 'Shop', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Location" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES ('loc_warehouse', 'WAREHOUSE', 'Warehouse', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Location" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES ('loc_service', 'SERVICE', 'Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Backfill LocationStock for SHOP from Product.stock
WITH shop AS (
  SELECT "id" FROM "Location" WHERE "code" = 'SHOP' LIMIT 1
)
INSERT INTO "LocationStock" ("locationId", "productId", "quantity", "updatedAt")
SELECT (SELECT "id" FROM shop), p."id", p."stock", CURRENT_TIMESTAMP
FROM "Product" p
WHERE p."stock" > 0
ON CONFLICT ("locationId","productId") DO NOTHING;