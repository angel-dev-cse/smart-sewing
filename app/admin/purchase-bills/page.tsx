import Link from "next/link";
import { db } from "@/lib/db";

export default async function PurchaseBillsPage() {
  const bills = await db.purchaseBill.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Purchase Bills</h1>
        <Link href="/admin/purchase-bills/new" className="underline">
          New Purchase
        </Link>
      </div>

      <div className="border rounded bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Bill</th>
              <th className="p-3">Supplier</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-mono">
                  <Link className="underline" href={`/admin/purchase-bills/${b.id}`}>
                    PB-{String(b.billNo).padStart(6, "0")}
                  </Link>
                </td>
                <td className="p-3">{b.supplierName}</td>
                <td className="p-3 font-mono">{b.status}</td>
                <td className="p-3 font-semibold">৳ {b.total.toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">
                  {new Date(b.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}

            {bills.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-sm text-gray-600">
                  No purchase bills yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
