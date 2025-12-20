import Link from "next/link";
import { db } from "@/lib/db";

type Props = {
  searchParams?: Promise<{
    accountId?: string;
    kind?: string;
    q?: string;
  }>;
};

export default async function LedgerEntriesPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const accountId = (sp.accountId ?? "").trim();
  const kindRaw = (sp.kind ?? "").trim().toUpperCase();
  const q = (sp.q ?? "").trim();

  const kind =
    kindRaw === "EXPENSE" || kindRaw === "INCOME" ? (kindRaw as "EXPENSE" | "INCOME") : "";

  const accounts = await db.ledgerAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const entries = await db.ledgerEntry.findMany({
    where: {
      ...(accountId ? { accountId } : {}),
      ...(kind
        ? { category: { kind } }
        : {}),
      ...(q
        ? {
            OR: [
              { note: { contains: q, mode: "insensitive" } },
              { refId: { contains: q, mode: "insensitive" } },
              { refType: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: 200,
    include: {
      account: { select: { name: true } },
      category: { select: { name: true, kind: true } },
    },
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Ledger entries</h1>
          <p className="text-sm text-gray-600">Showing latest 200 entries.</p>
        </div>

        <div className="flex gap-3 text-sm">
          <Link className="rounded bg-black text-white px-3 py-1" href="/admin/ledger/entries/new">
            Add entry
          </Link>
          <Link className="underline" href="/admin/ledger">
            Back
          </Link>
        </div>
      </div>

      <form action="/admin/ledger/entries" className="mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Account</label>
          <select
            name="accountId"
            defaultValue={accountId}
            className="border rounded px-3 py-2 text-sm bg-white min-w-[220px]"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Kind</label>
          <select name="kind" defaultValue={kind} className="border rounded px-3 py-2 text-sm bg-white">
            <option value="">All</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Search</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="note/ref..."
            className="border rounded px-3 py-2 text-sm w-[260px]"
          />
        </div>

        <button className="rounded bg-black px-4 py-2 text-white text-sm">Apply</button>
        {(accountId || kind || q) && (
          <Link className="text-sm underline text-gray-700 ml-2" href="/admin/ledger/entries">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Account</th>
              <th className="p-3">Category</th>
              <th className="p-3">Dir</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Note</th>
              <th className="p-3">Ref</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">
                  {new Date(e.occurredAt).toLocaleString()}
                </td>
                <td className="p-3 whitespace-nowrap">{e.account.name}</td>
                <td className="p-3">
                  {e.category ? (
                    <div>
                      <div className="text-xs text-gray-500">{e.category.kind}</div>
                      <div>{e.category.name}</div>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 font-mono">{e.direction}</td>
                <td className="p-3 font-mono whitespace-nowrap">
                  ৳ {e.amount.toLocaleString()}
                </td>
                <td className="p-3">{e.note ?? "—"}</td>
                <td className="p-3 font-mono text-xs">
                  {e.refType && e.refId ? `${e.refType}:${e.refId.slice(0, 8)}…` : "—"}
                </td>
              </tr>
            ))}

            {entries.length === 0 && (
              <tr>
                <td className="p-3" colSpan={7}>
                  No entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
