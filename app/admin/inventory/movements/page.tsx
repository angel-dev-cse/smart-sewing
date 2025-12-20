import Link from "next/link";
import { db } from "@/lib/db";

export default async function InventoryMovementsPage() {
  const movements = await db.inventoryMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { title: true } } },
  });

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <h1 className="text-2xl font-bold">Inventory ledger</h1>
        <Link className="underline text-sm" href="/admin/inventory">
          Back to inventory
        </Link>
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Product</th>
              <th className="p-3">Kind</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Before</th>
              <th className="p-3">After</th>
              <th className="p-3">Ref</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3 whitespace-nowrap">
                  {new Date(m.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  <Link className="underline" href={`/admin/inventory/${m.productId}`}>
                    {m.product.title}
                  </Link>
                </td>
                <td className="p-3 font-mono">{m.kind}</td>
                <td className="p-3">{m.quantity}</td>
                <td className="p-3">{m.beforeStock}</td>
                <td className="p-3 font-semibold">{m.afterStock}</td>
                <td className="p-3 font-mono">
                  {m.refType ? `${m.refType}${m.refId ? `:${m.refId.slice(0, 8)}…` : ""}` : "—"}
                </td>
                <td className="p-3">{m.note ?? "—"}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td className="p-3" colSpan={8}>
                  No movements yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 mt-3">Showing latest 200 movements.</p>
    </div>
  );
}
