import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminLedgerPage() {
  const accounts = await db.ledgerAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true, openingBalance: true },
  });

  const sums = await db.ledgerEntry.groupBy({
    by: ["accountId", "direction"],
    _sum: { amount: true },
  });

  const sumMap = new Map<string, { inSum: number; outSum: number }>();
  for (const row of sums) {
    const cur = sumMap.get(row.accountId) ?? { inSum: 0, outSum: 0 };
    const v = row._sum.amount ?? 0;
    if (row.direction === "IN") cur.inSum += v;
    else cur.outSum += v;
    sumMap.set(row.accountId, cur);
  }

  const rows = accounts.map((a) => {
    const s = sumMap.get(a.id) ?? { inSum: 0, outSum: 0 };
    const balance = a.openingBalance + s.inSum - s.outSum;
    return { ...a, ...s, balance };
  });

  const totalBalance = rows.reduce((sum, r) => sum + r.balance, 0);

  const recent = await db.ledgerEntry.findMany({
    orderBy: { occurredAt: "desc" },
    take: 20,
    include: {
      account: { select: { name: true } },
      category: { select: { name: true, kind: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ledger</h1>
          <p className="text-sm text-gray-600">Cashflow + expenses + balance.</p>
        </div>

        <div className="flex gap-3 text-sm">
          <Link className="rounded bg-black text-white px-3 py-1" href="/admin/ledger/entries/new">
            Add entry
          </Link>
          <Link className="underline" href="/admin/ledger/entries">
            View all
          </Link>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <p className="text-sm text-gray-600">Total balance</p>
        <p className="text-2xl font-bold">৳ {totalBalance.toLocaleString()}</p>
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Account</th>
              <th className="p-3">IN</th>
              <th className="p-3">OUT</th>
              <th className="p-3">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.kind}</div>
                </td>
                <td className="p-3 font-mono">৳ {r.inSum.toLocaleString()}</td>
                <td className="p-3 font-mono">৳ {r.outSum.toLocaleString()}</td>
                <td className="p-3 font-mono font-semibold">৳ {r.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Recent entries</p>
          <Link className="underline text-sm" href="/admin/ledger/entries">
            Open ledger
          </Link>
        </div>

        <ul className="divide-y">
          {recent.map((e) => (
            <li key={e.id} className="py-3 flex justify-between gap-4">
              <div>
                <div className="text-sm">
                  <span className="font-mono">{e.direction}</span>{" "}
                  <span className="font-semibold">৳ {e.amount.toLocaleString()}</span>{" "}
                  <span className="text-gray-600">({e.account.name})</span>
                </div>
                <div className="text-xs text-gray-600">
                  {e.category ? `${e.category.kind}: ${e.category.name}` : "No category"}
                  {e.note ? ` • ${e.note}` : ""}
                </div>
              </div>
              <div className="text-xs text-gray-600 whitespace-nowrap">
                {new Date(e.occurredAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
