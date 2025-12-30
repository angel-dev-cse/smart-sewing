import Link from "next/link";
import { db } from "@/lib/db";
import UnitizeStockUI from "./ui";

export default async function UnitizeStockPage() {
  // Get all asset-tracked products with their stock by location
  const products = await db.product.findMany({
    where: {
      isActive: true,
      isAssetTracked: true
    },
    include: {
      locationStocks: {
        include: {
          location: true
        }
      }
    },
    orderBy: { title: "asc" }
  });

  // Get unit counts for each product-location combination
  const unitCounts = await db.unit.groupBy({
    by: ['productId', 'currentLocationId'],
    where: {
      productId: { not: null },
      ownershipType: 'OWNED',
      status: {
        in: ['AVAILABLE', 'IN_SERVICE', 'RENTED_OUT', 'IDLE_AT_CUSTOMER']
      }
    },
    _count: { id: true }
  });

  // Create a map of unit counts by productId and locationId
  const unitCountMap = new Map<string, Map<string, number>>();
  unitCounts.forEach(count => {
    if (!count.productId || !count.currentLocationId) return;
    if (!unitCountMap.has(count.productId)) {
      unitCountMap.set(count.productId, new Map());
    }
    unitCountMap.get(count.productId)!.set(count.currentLocationId, count._count.id);
  });

  // Enrich products with unitization data
  const enrichedProducts = products.map(product => {
    const locationData = product.locationStocks.map(locationStock => {
      const unitCount = unitCountMap.get(product.id)?.get(locationStock.locationId) || 0;
      const stockQty = locationStock.quantity;
      const unitsNeeded = Math.max(0, stockQty - unitCount);

      return {
        locationId: locationStock.locationId,
        locationCode: locationStock.location.code,
        locationName: locationStock.location.name,
        stockQty,
        unitCount,
        unitsNeeded
      };
    }).filter(data => data.unitsNeeded > 0); // Only show locations that need unitization

    return {
      ...product,
      unitizationData: locationData
    };
  }).filter(product => product.unitizationData.length > 0); // Only show products that need unitization

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Unitize Stock</h1>
          <p className="text-sm text-gray-600">
            Convert existing tracked stock into individual units without changing stock totals.
          </p>
          <p className="text-xs text-orange-600 mt-2">
            ⚠️ This creates unit identities only. It does not change stock quantities or ledger entries.
          </p>
        </div>

        <Link className="rounded border px-3 py-2 text-sm" href="/admin/units">
          Back to Units
        </Link>
      </div>

      {enrichedProducts.length === 0 ? (
        <div className="rounded border bg-white p-8 text-center">
          <div className="text-gray-600">
            <p className="font-semibold mb-2">All tracked stock is already unitized!</p>
            <p className="text-sm">No products need unitization at this time.</p>
          </div>
        </div>
      ) : (
        <UnitizeStockUI products={enrichedProducts} />
      )}
    </div>
  );
}
