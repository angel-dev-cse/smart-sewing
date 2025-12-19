import Link from "next/link";
import { db } from "@/lib/db";

type Props = { searchParams?: Promise<{ q?: string }> };

export default async function AdminInvoicesPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const invoices = await db.salesInvoice.findMany({
    where: q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Sales Invoices</h1>
        <Link className="rounded bg-black px-4 py-2 text-white text-sm" href="/admin/invoices/new">
          New invoice
        </Link>
      </div>

      <form className="mb-4 flex gap-2" action="/admin/invoices">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by customer name..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>
        {q && (
          <Link className="underline text-sm self-center" href="/admin/invoices">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              <th className="p-3">Created</th>
              <th className="p-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="p-3 font-mono">INV-{String(inv.invoiceNo).padStart(6, "0")}</td>
                <td className="p-3">{inv.customerName}</td>
                <td className="p-3">{inv.status}</td>
                <td className="p-3 font-semibold">৳ {inv.total.toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <Link className="underline" href={`/admin/invoices/${inv.id}`}>Open</Link>
                </td>
              </tr>
            ))}

            {invoices.length === 0 && (
              <tr>
                <td className="p-3" colSpan={6}>
                  No invoices.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
