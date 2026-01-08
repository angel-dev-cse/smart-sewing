import Link from "next/link";
import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";

type Props = {
  params: Promise<{ id: string }>;
};

function fmt(no: number) {
  return `PR-${String(no).padStart(6, "0")}`;
}

export default async function PurchaseReturnDetailPage({ params }: Props) {
  const { id } = await params;

  const pr = await db.purchaseReturn.findUnique({
    where: { id },
    include: {
      purchaseBill: { select: { id: true, billNo: true } },
      party: { select: { id: true, name: true, type: true } },
      items: { orderBy: { createdAt: "asc" } },
      refunds: { orderBy: { createdAt: "asc" }, include: { ledgerEntry: true } },
    },
  });

  if (!pr) return <div className="p-4">Not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{fmt(pr.returnNo)}</h1>
          <p className="text-sm text-gray-600">Status: <span className="font-mono">{pr.status}</span></p>
          <p className="text-sm text-gray-600">Supplier: <span className="font-medium">{pr.supplierName}</span>{pr.phone ? ` • ${pr.phone}` : ""}</p>
          {pr.party ? (
            <p className="text-sm text-gray-600">
              Contact: <Link className="underline" href={`/admin/parties/${pr.party.id}`}>{pr.party.name}</Link>
            </p>
          ) : null}
        </div>

        <div className="text-sm text-right">
          {pr.purchaseBill ? (
            <div>
              Source: <Link className="underline" href={`/admin/purchase-bills/${pr.purchaseBill.id}`}>PB-{String(pr.purchaseBill.billNo).padStart(6, "0")}</Link>
            </div>
          ) : null}
          <div className="text-xs text-gray-600">Created: {new Date(pr.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Unit cost</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Line</th>
            </tr>
          </thead>
          <tbody>
            {pr.items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{it.titleSnapshot}</td>
                <td className="p-3 whitespace-nowrap">{formatBdtFromPaisa(it.unitCost)}</td>
                <td className="p-3 font-mono">{it.quantity}</td>
                <td className="p-3 font-semibold whitespace-nowrap">
                  {formatBdtFromPaisa(it.unitCost * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded border p-3 bg-white flex items-center justify-between">
        <span className="font-semibold">Total</span>
        <span className="font-bold">{formatBdtFromPaisa(pr.total)}</span>
      </div>

      <div className="rounded border p-3 bg-white">
        <p className="font-semibold mb-2">Refunds</p>
        {pr.refunds.length === 0 ? (
          <p className="text-sm text-gray-600">No refunds recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {pr.refunds.map((r) => (
              <li key={r.id} className="border rounded p-2">
                <div className="font-mono">{r.method} {formatBdtFromPaisa(r.amount)}</div>
                <div className="text-xs text-gray-600">{new Date(r.paidAt).toLocaleString()}</div>
                {r.note ? <div className="text-sm">{r.note}</div> : null}
                {r.ledgerEntry ? (
                  <div className="text-xs text-gray-600">Ledger entry: <span className="font-mono">{r.ledgerEntry.id}</span></div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pr.notes ? (
        <div className="rounded border p-3 bg-white">
          <p className="font-semibold mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{pr.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
