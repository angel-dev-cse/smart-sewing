import Link from "next/link";
import { db } from "@/lib/db";
import AdjustStockForm from "./ui";

export default async function AdjustInventoryPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, stock: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Adjust Inventory</h1>
        <p className="text-sm text-gray-600">
          Create a stock adjustment document + inventory movement.
        </p>
      </div>

      <AdjustStockForm products={products} />

      <div className="text-sm">
        <Link className="underline" href="/admin/inventory/movements">
          View movements
        </Link>
      </div>
    </div>
  );
}
