import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import InvoiceActions from "./ui-actions";

type Props = { params: Promise<{ id: string }> };

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;

  const invoice = await db.salesInvoice.findUnique({
    where: { id },
    include: { items: true, party: { select: { id: true, name: true } } },
  });

  if (!invoice) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
            INV-{String(invoice.invoiceNo).padStart(6, "0")}
          </h1>
          <p className="text-sm text-gray-600">
            Status: <span className="font-semibold">{invoice.status}</span>
          </p>
        </div>
        <a
          className="underline text-sm"
          href={`/admin/invoices/${invoice.id}/print`}
          target="_blank"
          rel="noreferrer"
        >
          Print
        </a>

        <Link className="underline" href="/admin/invoices">
          ← Back
        </Link>
      </div>

      <div className="rounded border bg-white p-4 space-y-1">
        <p><span className="font-semibold">Customer:</span> {invoice.customerName}</p>
        {invoice.party ? (
          <p className="text-sm">
            <span className="font-semibold">Linked contact:</span>{" "}
            <Link className="underline" href={`/admin/parties/${invoice.party.id}`}>
              {invoice.party.name}
            </Link>
          </p>
        ) : null}
        {invoice.phone && <p><span className="font-semibold">Phone:</span> {invoice.phone}</p>}
        {invoice.city && <p><span className="font-semibold">City:</span> {invoice.city}</p>}
        {invoice.addressLine1 && <p><span className="font-semibold">Address:</span> {invoice.addressLine1}</p>}
        {invoice.notes && <p className="text-sm text-gray-700"><span className="font-semibold">Notes:</span> {invoice.notes}</p>}
      </div>

      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-2">Items</p>
        <ul className="text-sm space-y-1">
          {invoice.items.map((it) => (
            <li key={it.id} className="flex justify-between">
              <span>
                {it.titleSnapshot} × {it.quantity}
              </span>
              <span>
                ৳ {(it.unitPrice * it.quantity).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t mt-3 pt-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>৳ {invoice.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>- ৳ {invoice.discount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery fee</span>
            <span>+ ৳ {invoice.deliveryFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2 mt-2">
            <span>Total</span>
            <span>৳ {invoice.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Next: we’ll add “Issue invoice” (locks it + decrements stock + logs inventory movements).
      </p>
    </div>
  );
}
