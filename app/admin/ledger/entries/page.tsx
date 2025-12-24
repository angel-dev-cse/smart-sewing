import Link from "next/link";
import { db } from "@/lib/db";

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtDT(d: Date) {
  return d.toLocaleString();
}

function refHref(refType: string | null, refId: string | null): string | null {
  if (!refType || !refId) return null;

  switch (refType) {
    case "POS_BILL":
      // POS bills are stored as SalesInvoice rows
      return `/admin/invoices/${refId}`;
    case "SALES_INVOICE":
      return `/admin/invoices/${refId}`;
    case "SALES_INVOICE_PAYMENT":
      return `/admin/invoices/${refId}`;
    case "SALES_RETURN":
      return `/admin/sales-returns/${refId}`;
    case "PURCHASE_BILL":
      return `/admin/purchase-bills/${refId}`;
    case "PURCHASE_RETURN":
      return `/admin/purchase-returns/${refId}`;
    case "RENTAL_BILL":
      return `/admin/rental-bills/${refId}`;
    case "WRITE_OFF":
      return `/admin/write-offs/${refId}`;
    default:
      return null;
  }
}

function refLabel(refType: string | null, refId: string | null) {
  if (!refType || !refId) return "—";
  switch (refType) {
    case "POS_BILL":
      return "POS bill";
    case "SALES_INVOICE":
      return "Sales invoice";
    case "SALES_INVOICE_PAYMENT":
      return "Invoice payment";
    case "SALES_RETURN":
      return "Sales return";
    case "PURCHASE_BILL":
      return "Purchase bill";
    case "PURCHASE_RETURN":
      return "Purchase return";
    case "RENTAL_BILL":
      return "Rental bill";
    case "WRITE_OFF":
      return "Write-off";
    default:
      return refType;
  }
}

type Props = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function LedgerEntriesPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const entries = await db.ledgerEntry.findMany({
    where: q
      ? {
          OR: [
            { note: { contains: q, mode: "insensitive" } },
            { refType: { contains: q, mode: "insensitive" } },
            { refId: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { occurredAt: "desc" },
    take: 100,
    include: {
      account: { select: { name: true, kind: true } },
      category: { select: { name: true } },
    },
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Ledger Entries</h1>
          <p className="text-sm text-gray-600">Latest 100 entries.</p>
        </div>
      </div>

      {/* Search */}
      <form action="/admin/ledger/entries" className="mb-4 flex gap-2 items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search note / refType / refId..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>

        {q && (
          <Link href="/admin/ledger/entries" className="text-sm underline text-gray-700">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Direction</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Account</th>
              <th className="p-3">Category</th>
              <th className="p-3">Ref</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const href = refHref(e.refType, e.refId);
              return (
                <tr key={e.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{fmtDT(e.occurredAt)}</td>
                  <td className="p-3 font-mono">{e.direction}</td>
                  <td className="p-3 font-semibold whitespace-nowrap">৳ {fmt(e.amount)}</td>
                  <td className="p-3">
                    {e.account.name} <span className="text-xs text-gray-600">({e.account.kind})</span>
                  </td>
                  <td className="p-3">{e.category?.name ?? <span className="text-gray-500">No category</span>}</td>
                  <td className="p-3 whitespace-nowrap">
                    {href ? (
                      <Link className="underline" href={href} title={`${e.refType} ${e.refId}`}>
                        {refLabel(e.refType, e.refId)}
                      </Link>
                    ) : e.refType ? (
                      <span className="font-mono text-xs" title={e.refId ?? undefined}>
                        {e.refType}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="p-3">{e.note ?? <span className="text-gray-500">—</span>}</td>
                </tr>
              );
            })}

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

      <p className="text-xs text-gray-600 mt-3">Showing latest 100 entries.</p>
    </div>
  );
}
