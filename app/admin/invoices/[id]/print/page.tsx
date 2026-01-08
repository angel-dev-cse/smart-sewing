import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import Link from "next/link";


type Props = { params: Promise<{ id: string }> };

function formatInvNo(n: number) {
  return `INV-${String(n).padStart(6, "0")}`;
}

export default async function InvoicePrintPage({ params }: Props) {
  const { id } = await params;

  const invoice = await db.salesInvoice.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!invoice) notFound();

  return (
    <div className="print:mx-0 mx-auto max-w-3xl p-6 bg-white text-black">
      {/* Top actions (hidden in print) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <PrintButton />

        <Link className="underline text-sm" href={`/admin/invoices/${invoice.id}`}>
          Back to invoice
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Smart Sewing Solutions</h1>
          <p className="text-sm">Chittagong, Bangladesh</p>
          <p className="text-sm mt-1">Phone: (add your business number)</p>
          <p className="text-sm">Email: (add your email)</p>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold">INVOICE</p>
          <p className="font-mono">{formatInvNo(invoice.invoiceNo)}</p>
          <p className="text-sm">Status: {invoice.status}</p>
          <p className="text-sm">
            Date: {new Date(invoice.issuedAt ?? invoice.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Customer */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="font-semibold mb-1">Bill To</p>
          <p>{invoice.customerName}</p>
          {invoice.phone && <p className="text-sm">Phone: {invoice.phone}</p>}
          {invoice.addressLine1 && <p className="text-sm">{invoice.addressLine1}</p>}
          {invoice.city && <p className="text-sm">{invoice.city}</p>}
        </div>

        <div className="md:text-right">
          <p className="font-semibold mb-1">Payment</p>
          <p className="text-sm">
            Method: {invoice.paymentMethod ?? "—"}
          </p>
          <p className="text-sm">
            Status: {invoice.paymentStatus}
          </p>
        </div>
      </div>

      {/* Items table */}
      <div className="mt-6">
        <table className="w-full text-sm border border-black/20">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b border-black/20 text-left">Item</th>
              <th className="p-2 border-b border-black/20 text-right">Unit</th>
              <th className="p-2 border-b border-black/20 text-right">Qty</th>
              <th className="p-2 border-b border-black/20 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.id}>
                <td className="p-2 border-b border-black/10">{it.titleSnapshot}</td>
                <td className="p-2 border-b border-black/10 text-right">
                  {formatBdtFromPaisa(it.unitPrice)}
                </td>
                <td className="p-2 border-b border-black/10 text-right">{it.quantity}</td>
                <td className="p-2 border-b border-black/10 text-right">
                  {formatBdtFromPaisa(it.unitPrice * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-sm text-sm space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatBdtFromPaisa(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>- {formatBdtFromPaisa(invoice.discount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery fee</span>
            <span>+ {formatBdtFromPaisa(invoice.deliveryFee)}</span>
          </div>

          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>{formatBdtFromPaisa(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes / Terms */}
      <div className="mt-6 border-t pt-4 text-sm">
        {invoice.notes && (
          <div className="mb-3">
            <p className="font-semibold">Notes</p>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <p className="font-semibold">Terms</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Goods sold are not returnable unless agreed.</li>
          <li>Warranty depends on brand/service terms.</li>
          <li>For rentals: monthly billing applies (if applicable).</li>
        </ul>
      </div>

      {/* Signature */}
      <div className="mt-10 flex justify-between items-end">
        <div>
          <p className="text-sm">Customer signature</p>
          <div className="mt-8 w-56 border-t border-black" />
        </div>

        <div className="text-right">
          <p className="text-sm">Authorized signature</p>
          <div className="mt-8 w-56 border-t border-black ml-auto" />
        </div>
      </div>

      {/* Print hint */}
      <p className="mt-6 text-xs text-gray-600 print:hidden">
        Tip: In the print dialog, choose “Save as PDF”.
      </p>
    </div>
  );
}
