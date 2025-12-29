import Link from "next/link";
import { db } from "@/lib/db";
import NewUnitForm from "./ui";

export default async function NewUnitPage() {
  const locations = await db.location.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const products = await db.product.findMany({
    where: { isActive: true, isAssetTracked: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, type: true, serialRequired: true },
  });

  const parties = await db.party.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">New Unit</h1>
          <p className="text-sm text-gray-600">
            Add a new unit to track individual machines, parts, or customer-owned items.
          </p>
        </div>

        <Link className="rounded border px-3 py-2 text-sm" href="/admin/units">
          Back
        </Link>
      </div>

      <div className="rounded border bg-white p-6">
        <NewUnitForm
          locations={locations}
          products={products}
          parties={parties}
        />
      </div>
    </div>
  );
}
