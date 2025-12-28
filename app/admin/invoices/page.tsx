import Link from "next/link";
import { db } from "@/lib/db";

export default async function InvoicesPage() {
  const invoices = await db.salesInvoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Invoices</h1>
          <p className="text-sm text-gray-600">Latest 50 invoices (orders + POS).</p>
        </div>

        <Link className="rounded bg-black text-white px-3 py-1 text-sm" href="/admin/invoices/new">
          New Sales Invoice
        </Link>
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Total</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="p-3 font-mono">
                  <Link className="underline" href={`/admin/invoices/${inv.id}`}>
                    #{inv.invoiceNo}
                  </Link>
                </td>
                <td className="p-3">{inv.customerName || "—"}</td>
                <td className="p-3 font-mono">{inv.status}</td>
                <td className="p-3 font-mono">{inv.paymentStatus}</td>
                <td className="p-3 font-semibold whitespace-nowrap">৳ {inv.total.toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">{new Date(inv.createdAt).toLocaleString()}</td>
              </tr>
            ))}

            {invoices.length === 0 && (
              <tr>
                <td className="p-3" colSpan={6}>
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
