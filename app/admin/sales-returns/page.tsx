import Link from "next/link";
import { db } from "@/lib/db";

type Props = {
  searchParams?: Promise<{ status?: string; q?: string }>;
};

const STATUSES = ["ALL", "ISSUED", "DRAFT", "CANCELLED"] as const;

function fmt(no: number) {
  return `SR-${String(no).padStart(6, "0")}`;
}

export default async function SalesReturnsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const statusRaw = String(sp.status ?? "ISSUED").toUpperCase();
  const status = STATUSES.includes(statusRaw as (typeof STATUSES)[number])
    ? (statusRaw as (typeof STATUSES)[number])
    : "ISSUED";

  const q = String(sp.q ?? "").trim();
  const qNo = Number(q);
  const qNoFilter = Number.isInteger(qNo) && qNo > 0 ? qNo : null;

  const rows = await db.salesReturn.findMany({
    where: {
      ...(status !== "ALL" ? { status } : {}),
      ...(q
        ? {
            OR: [
              ...(qNoFilter ? [{ returnNo: qNoFilter }] : []),
              { id: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      salesInvoice: { select: { id: true, invoiceNo: true } },
      party: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  function href(nextStatus: string, nextQ: string) {
    const params = new URLSearchParams();
    params.set("status", nextStatus);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    return `/admin/sales-returns?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Sales Returns</h1>
        <Link className="rounded bg-black px-4 py-2 text-white text-sm" href="/admin/sales-returns/new">
          New Sales Return
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={href(s, q)}
              className={[
                "rounded px-3 py-1 text-sm border",
                active ? "bg-black text-white border-black" : "bg-white",
              ].join(" ")}
            >
              {s[0] + s.slice(1).toLowerCase()}
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <form action="/admin/sales-returns" className="mb-4 flex gap-2 items-center">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by SR number, name, phone, id..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>

        {q && (
          <Link href={href(status, "")} className="text-sm underline text-gray-700">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Return</th>
              <th className="p-3">Invoice</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono">
                  <Link className="underline" href={`/admin/sales-returns/${r.id}`}>
                    {fmt(r.returnNo)}
                  </Link>
                </td>
                <td className="p-3 font-mono">
                  {r.salesInvoice ? (
                    <Link className="underline" href={`/admin/invoices/${r.salesInvoice.id}`}>
                      INV-{String(r.salesInvoice.invoiceNo).padStart(6, "0")}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">
                  {r.party ? (
                    <Link className="underline" href={`/admin/parties/${r.party.id}`}>
                      {r.customerName}
                    </Link>
                  ) : (
                    r.customerName
                  )}
                  {r.phone ? <div className="text-xs text-gray-500">{r.phone}</div> : null}
                </td>
                <td className="p-3 font-mono">{r.status}</td>
                <td className="p-3 font-semibold whitespace-nowrap">৳ {r.total.toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={6}>
                  No matching returns.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
