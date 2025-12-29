import Link from "next/link";
import { db } from "@/lib/db";
import UnitsTable from "./ui/UnitsTable";
import UnitsFilters from "./ui/UnitsFilters";

type SearchParams = {
  ownershipType?: string;
  status?: string;
  locationId?: string;
  productId?: string;
  search?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function UnitsPage({ searchParams }: Props) {
  const params = await searchParams;

  // Get filter options
  const locations = await db.location.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const products = await db.product.findMany({
    where: { isActive: true, isAssetTracked: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, type: true },
  });

  const ownershipTypes = ["OWNED", "CUSTOMER_OWNED", "RENTED_IN"] as const;
  const statuses = [
    "AVAILABLE",
    "IN_SERVICE",
    "IDLE_AT_CUSTOMER",
    "RENTED_OUT",
    "RENTED_IN_ACTIVE",
    "SOLD",
    "SCRAPPED",
    "RETURNED_TO_SUPPLIER",
    "RETURNED_TO_CUSTOMER"
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Units / Assets</h1>
          <p className="text-sm text-gray-600">
            Track individual machines, parts, and customer-owned units.
          </p>
        </div>

        <Link className="rounded bg-black px-3 py-2 text-white text-sm" href="/admin/units/new">
          + New unit
        </Link>
      </div>

      <UnitsFilters
        locations={locations}
        products={products}
        ownershipTypes={ownershipTypes}
        statuses={statuses}
        currentFilters={params}
      />

      <UnitsTable filters={params} />
    </div>
  );
}
