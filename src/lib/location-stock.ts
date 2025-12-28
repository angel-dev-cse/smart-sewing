// src/lib/location-stock.ts
// Phase 8C.2 (Locations + transfers): keep LocationStock in sync with Product.stock
// Default behavior (MVP): documents affect SHOP location unless explicitly a transfer.

type Tx = any;

export async function getDefaultLocationIds(tx: Tx) {
  // Prefer DB lookup by code (robust), fallback to seeded stable IDs.
  const [shop, warehouse, service] = await Promise.all([
    tx.location.findUnique({ where: { code: "SHOP" }, select: { id: true } }).catch(() => null),
    tx.location.findUnique({ where: { code: "WAREHOUSE" }, select: { id: true } }).catch(() => null),
    tx.location.findUnique({ where: { code: "SERVICE" }, select: { id: true } }).catch(() => null),
  ]);

  return {
    shopId: shop?.id ?? "loc_shop",
    warehouseId: warehouse?.id ?? "loc_warehouse",
    serviceId: service?.id ?? "loc_service",
  };
}

export async function getLocationStockQty(tx: Tx, args: { productId: string; locationId: string }) {
  const row = await tx.locationStock.findUnique({
    // Your Prisma compound unique is named: locationId_productId
    where: {
      locationId_productId: {
        locationId: args.locationId,
        productId: args.productId,
      },
    },
    // Your field is named: quantity
    select: { quantity: true },
  });

  return row?.quantity ?? 0;
}

export async function bumpLocationStock(
  tx: Tx,
  args: { productId: string; locationId: string; delta: number }
) {
  const delta = Math.trunc(args.delta);
  if (!Number.isFinite(delta) || delta === 0) return;

  await tx.locationStock.upsert({
    // Your Prisma compound unique is named: locationId_productId
    where: {
      locationId_productId: {
        locationId: args.locationId,
        productId: args.productId,
      },
    },
    update: { quantity: { increment: delta } },
    create: { productId: args.productId, locationId: args.locationId, quantity: delta },
  });
}
