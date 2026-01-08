import Link from "next/link";
import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";

type Props = {
  params: Promise<{ id: string }>;
};

function fmt(no: number) {
  return `SR-${String(no).padStart(6, "0")}`;
}

export default async function SalesReturnDetailPage({ params }: Props) {
  const { id } = await params;

  const sr = await db.salesReturn.findUnique({
    where: { id },
    include: {
      salesInvoice: { select: { id: true, invoiceNo: true } },
      party: { select: { id: true, name: true } },
      items: { orderBy: { createdAt: "asc" } },
      refunds: { include: { ledgerEntry: true }, orderBy: { paidAt: "asc" } },
    },
  });

  if (!sr) return <div>Not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Return {fmt(sr.returnNo)}</h1>
          <div className="text-sm text-gray-600">
            Status: <span className="font-mono">{sr.status}</span>
          </div>
        </div>

        <Link href="/admin/sales-returns" className="underline text-sm">
          Back
        </Link>
      </div>

      <div className="rounded border p-3 space-y-2">
        <p className="font-semibold">Customer</p>
        <div className="text-sm">
          {sr.customerName}
          {sr.phone ? <span className="text-gray-500"> • {sr.phone}</span> : null}
        </div>
        {sr.party ? (
          <div className="text-sm">
            Contact: <Link className="underline" href={`/admin/parties/${sr.party.id}`}>{sr.party.name}</Link>
          </div>
        ) : null}
        {sr.salesInvoice ? (
          <div className="text-sm">
            From invoice:{" "}
            <Link className="underline font-mono" href={`/admin/invoices/${sr.salesInvoice.id}`}>
              INV-{String(sr.salesInvoice.invoiceNo).padStart(6, "0")}
            </Link>
          </div>
        ) : null}
      </div>

      <div className="rounded border p-3">
        <p className="font-semibold mb-2">Items</p>
        <table className="w-full text-sm">
          <thead className="text-left bg-gray-50">
            <tr>
              <th className="p-2">Item</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {sr.items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.titleSnapshot}</td>
                <td className="p-2 font-mono">{it.quantity}</td>
                <td className="p-2 font-mono">{formatBdtFromPaisa(it.unitPrice)}</td>
                <td className="p-2 font-mono">
                  {formatBdtFromPaisa(it.unitPrice * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t mt-2 pt-2 font-bold">
          Return total: {formatBdtFromPaisa(sr.total)}
        </div>
      </div>

      <div className="rounded border p-3 space-y-2">
        <p className="font-semibold">Refunds</p>
        {sr.refunds.length === 0 ? (
          <p className="text-sm text-gray-600">No refund recorded.</p>
        ) : (
          <ul className="space-y-2">
            {sr.refunds.map((r) => (
              <li key={r.id} className="border rounded p-2">
                <div className="text-sm">
                  <span className="font-mono">{r.method}</span> — {formatBdtFromPaisa(r.amount)}
                </div>
                {r.note ? <div className="text-xs text-gray-600">{r.note}</div> : null}
                {r.ledgerEntry ? (
                  <div className="text-xs text-gray-600">
                    Ledger entry: <span className="font-mono">{r.ledgerEntry.id}</span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
