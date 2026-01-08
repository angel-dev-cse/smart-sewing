import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";
import { getDefaultLocationIds } from "@/lib/location-stock";
import IssuePanel from "./IssuePanel";

type Props = { params: Promise<{ id: string }> };

export default async function PurchaseBillDetailPage({ params }: Props) {
  const { id } = await params;

  const bill = await db.purchaseBill.findUnique({
    where: { id },
    include: {
      party: { select: { id: true, name: true, type: true, phone: true } },
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              type: true,
              isAssetTracked: true,
              serialRequired: true,
              brand: true,
              model: true,
              stock: true,
            },
          },
        },
      },
      payments: {
        orderBy: { paidAt: "desc" },
        include: {
          ledgerEntry: {
            select: {
              id: true,
              direction: true,
              amount: true,
              occurredAt: true,
              account: { select: { name: true, kind: true } },
            },
          },
        },
      },
    },
  });

  if (!bill) return notFound();

  const locations = await db.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
  const defaults = await getDefaultLocationIds(db);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Purchase Bill <span className="font-mono">PB-{String(bill.billNo).padStart(6, "0")}</span>
          </h1>
          <div className="text-sm text-gray-600 mt-1">
            Status: <span className="font-mono">{bill.status}</span> · Created {new Date(bill.createdAt).toLocaleString()}
          </div>
        </div>

        <Link href="/admin/purchase-bills" className="text-sm underline">
          ← Back to Purchase Bills
        </Link>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold mb-2">Supplier</h2>
        <div className="text-sm">
          <div className="font-medium">{bill.supplierName}</div>
          {bill.phone ? <div className="text-gray-600">{bill.phone}</div> : null}
          {bill.party ? (
            <div className="mt-2 text-sm">
              Linked contact: {" "}
              <Link className="underline" href={`/admin/parties/${bill.party.id}`}>
                {bill.party.name}
              </Link>{" "}
              <span className="text-xs text-gray-600">({bill.party.type})</span>
            </div>
          ) : null}
          {bill.notes ? <div className="mt-2 text-gray-700">Notes: {bill.notes}</div> : null}
        </div>
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Unit cost</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Line total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{it.titleSnapshot}</td>
                <td className="p-3 whitespace-nowrap">{formatBdtFromPaisa(it.unitCost)}</td>
                <td className="p-3 font-mono">{it.quantity}</td>
                <td className="p-3 whitespace-nowrap font-semibold">
                  {formatBdtFromPaisa(it.unitCost * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded border bg-white p-4">
          <h2 className="font-semibold mb-2">Totals</h2>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">{formatBdtFromPaisa(bill.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-mono font-semibold">{formatBdtFromPaisa(bill.total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="font-semibold mb-2">Payments</h2>
          {bill.payments.length === 0 ? (
            <div className="text-sm text-gray-600">No payments recorded.</div>
          ) : (
            <div className="space-y-3">
              {bill.payments.map((p) => (
                <div key={p.id} className="rounded border p-3">
                  <div className="text-sm font-mono">
                    {p.method} · {formatBdtFromPaisa(p.amount)} · {new Date(p.paidAt).toLocaleString()}
                  </div>
                  {p.note ? <div className="text-xs text-gray-600 mt-1">{p.note}</div> : null}

                  {p.ledgerEntry ? (
                    <div className="text-xs text-gray-600 mt-2">
                      Ledger: {p.ledgerEntry.direction} {formatBdtFromPaisa(p.ledgerEntry.amount)} ({p.ledgerEntry.account.name})
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 mt-2">Ledger: not linked</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <IssuePanel
        billId={bill.id}
        status={bill.status}
        items={bill.items}
        locations={locations}
        defaultLocationId={locations.find((l) => l.code === "SHOP")?.id ?? defaults.shopId}
      />
    </div>
  );
}
