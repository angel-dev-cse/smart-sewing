import Link from "next/link";
import { db } from "@/lib/db";

export default async function StockTransfersPage() {
  const transfers = await db.stockTransfer.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fromLocation: { select: { code: true, name: true } },
      toLocation: { select: { code: true, name: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Stock Transfers</h1>
          <p className="text-sm text-gray-600">Move stock between locations (Shop / Warehouse / Service).</p>
        </div>

        <Link className="rounded bg-black px-3 py-2 text-white text-sm" href="/admin/transfers/new">
          + New transfer
        </Link>
      </div>

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">No</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2 font-mono">ST-{String(t.transferNo).padStart(6, "0")}</td>
                <td className="px-3 py-2">
                  <span className="font-semibold">{t.fromLocation.code}</span>{" "}
                  <span className="text-gray-600">({t.fromLocation.name})</span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-semibold">{t.toLocation.code}</span>{" "}
                  <span className="text-gray-600">({t.toLocation.name})</span>
                </td>
                <td className="px-3 py-2">{t._count.items}</td>
                <td className="px-3 py-2">{t.status}</td>
                <td className="px-3 py-2">{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}

            {transfers.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-gray-600" colSpan={6}>
                  No transfers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
