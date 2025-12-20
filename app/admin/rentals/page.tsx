import Link from "next/link";
import { db } from "@/lib/db";

export default async function RentalsPage() {
  const rentals = await db.rentalContract.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Rentals</h1>
          <p className="text-sm text-gray-600">Latest 50 contracts.</p>
        </div>

        <Link className="rounded bg-black text-white px-3 py-1 text-sm" href="/admin/rentals/new">
          New contract
        </Link>
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Contract</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Items</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <Link className="underline" href={`/admin/rentals/${r.id}`}>
                    #{r.contractNo}
                  </Link>
                </td>
                <td className="p-3">{r.customerName}</td>
                <td className="p-3 font-mono">{r.status}</td>
                <td className="p-3">{r.items.length}</td>
                <td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {rentals.length === 0 && (
              <tr>
                <td className="p-3" colSpan={5}>
                  No rentals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
