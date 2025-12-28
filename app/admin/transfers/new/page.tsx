import Link from "next/link";
import { db } from "@/lib/db";
import NewTransferForm from "./ui";

export default async function NewStockTransferPage() {
  const locations = await db.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });

  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    take: 400,
    select: { id: true, title: true },
  });

  const shop = locations.find((l) => l.code === "SHOP");
  const warehouse = locations.find((l) => l.code === "WAREHOUSE");
  const defaultFrom = shop?.id ?? locations[0]?.id ?? "";
  const defaultTo = warehouse?.id ?? locations[0]?.id ?? "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">New Stock Transfer</h1>
          <p className="text-sm text-gray-600">Create a transfer: From → To, with one or more items.</p>
        </div>

        <Link className="rounded border px-3 py-2 text-sm" href="/admin/transfers">
          Back
        </Link>
      </div>

      <div className="rounded border bg-white p-4">
        <NewTransferForm
          locations={locations}
          products={products}
          defaultFromLocationId={defaultFrom}
          defaultToLocationId={defaultTo}
        />
      </div>
    </div>
  );
}
