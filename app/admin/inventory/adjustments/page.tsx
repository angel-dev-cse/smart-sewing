import Link from "next/link";
import { db } from "@/lib/db";

export default async function StockAdjustmentsPage() {
  const adjustments = await db.stockAdjustment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: {
        select: { id: true },
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock Adjustments</h1>
          <p className="text-sm text-gray-600">
            Documents created by manual stock adjustments.
          </p>
        </div>

        <Link
          href="/admin/inventory/adjust"
          className="rounded bg-black px-4 py-2 text-white text-sm"
        >
          New adjustment
        </Link>
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Created</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Items</th>
              <th className="p-3">ID</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3 whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  <Link className="underline" href={`/admin/inventory/adjustments/${a.id}`}>
                    {a.reason ?? "(no reason)"}
                  </Link>
                </td>
                <td className="p-3 whitespace-nowrap">{a.items.length}</td>
                <td className="p-3 font-mono text-xs whitespace-nowrap">
                  {a.id.slice(0, 12)}…
                </td>
              </tr>
            ))}

            {adjustments.length === 0 && (
              <tr>
                <td className="p-3" colSpan={4}>
                  No stock adjustments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">Showing latest 100 adjustments.</p>
    </div>
  );
}
