import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";
import InvoicePaymentActions from "./payment-actions";
import InvoiceActions from "./ui-actions";

const PAYMENT_REF_TYPE = "SALES_INVOICE_PAYMENT" as const;

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;

  const inv = await db.salesInvoice.findUnique({
    where: { id },
    include: {
      party: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { title: true } } },
      },
    },
  });

  if (!inv) notFound();

  const accounts = await db.ledgerAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true },
  });

  const payments = await db.ledgerEntry.findMany({
    where: {
      refType: PAYMENT_REF_TYPE,
      refId: inv.id,
      direction: "IN",
    },
    orderBy: { occurredAt: "desc" },
    include: {
      account: { select: { name: true, kind: true } },
    },
  });

  const paid = payments.reduce((sum, e) => sum + e.amount, 0);
  const remaining = Math.max(0, inv.total - paid);

  const ledgerLink = `/admin/ledger/entries?q=${encodeURIComponent(inv.id)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Invoice</h1>
          <p className="text-sm text-gray-600">
            Invoice: <span className="font-mono">#{inv.invoiceNo}</span>
          </p>
          <p className="text-xs text-gray-600 font-mono break-all">{inv.id}</p>
          <p className="text-sm text-gray-600">
            Status: <span className="font-mono">{inv.status}</span>
          </p>
          <p className="text-sm text-gray-600">
            Payment: <span className="font-mono">{inv.paymentStatus}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <InvoiceActions invoiceId={inv.id} status={inv.status} />

          <Link className="text-sm underline" href="/admin/invoices">
            Back
          </Link>
          <Link className="text-sm underline" href={ledgerLink}>
            View related ledger entries
          </Link>
        </div>
      </div>

      {/* Customer */}
      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-2">Customer</p>
        <p>{inv.customerName || "—"}</p>
        {inv.party ? (
          <p className="text-xs text-gray-600 mt-1">
            Linked contact:{" "}
            <Link className="underline" href={`/admin/parties/${inv.party.id}`}>
              {inv.party.name}
            </Link>
          </p>
        ) : null}
        {inv.phone ? <p className="text-sm text-gray-700">{inv.phone}</p> : null}
        {inv.addressLine1 ? <p className="text-sm text-gray-700 mt-2">{inv.addressLine1}</p> : null}
        {inv.city ? <p className="text-sm text-gray-700">{inv.city}</p> : null}
      </div>

      {/* Items */}
      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-3">Items</p>
        {inv.items.length === 0 ? (
          <p className="text-sm text-gray-600">No items.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Line</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-3">{it.titleSnapshot}</td>
                    <td className="p-3 font-mono">{it.quantity}</td>
                    <td className="p-3 font-mono">{formatBdtFromPaisa(it.unitPrice)}</td>
                    <td className="p-3 font-mono">{formatBdtFromPaisa(it.unitPrice * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t mt-4 pt-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">{formatBdtFromPaisa(inv.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="font-semibold">{formatBdtFromPaisa(inv.discount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-semibold">{formatBdtFromPaisa(inv.total)}</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="rounded border bg-white p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Payments</p>
            <p className="text-sm text-gray-600">
              Paid: <span className="font-mono">{formatBdtFromPaisa(paid)}</span> · Remaining:{" "}
              <span className="font-mono">{formatBdtFromPaisa(remaining)}</span>
            </p>
          </div>

          <div className="text-sm">
            <Link className="underline" href={`/admin/ledger/entries?q=${encodeURIComponent(PAYMENT_REF_TYPE)}`}>
              Search payments in ledger
            </Link>
          </div>
        </div>

        <InvoicePaymentActions
          invoiceId={inv.id}
          total={inv.total}
          paid={paid}
          paymentStatus={inv.paymentStatus}
          accounts={accounts}
        />

        {payments.length === 0 ? (
          <p className="text-sm text-gray-600">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{new Date(p.occurredAt).toLocaleString()}</td>
                    <td className="p-3">{p.account.name} ({p.account.kind})</td>
                    <td className="p-3 font-mono whitespace-nowrap">
                      {formatBdtFromPaisa(p.amount)}
                    </td>
                    <td className="p-3 text-gray-700">{p.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
