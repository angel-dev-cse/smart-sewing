import Link from "next/link";
import { db } from "@/lib/db";

type Props = {
  searchParams?: Promise<{
    status?: string;
    payment?: string;
    q?: string;
  }>;
};

const STATUSES = ["ALL", "DRAFT", "ISSUED", "CANCELLED"] as const;
const PAYMENTS = ["ALL", "UNPAID", "PAID"] as const;

export default async function AdminRentalBillsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const status = (sp.status ?? "ISSUED").toUpperCase();
  const payment = (sp.payment ?? "ALL").toUpperCase();
  const q = (sp.q ?? "").trim();

  const statusFilter = STATUSES.includes(status as "ALL" | "DRAFT" | "ISSUED" | "CANCELLED") ? status as "DRAFT" | "ISSUED" | "CANCELLED" : "ISSUED";
  const paymentFilter = PAYMENTS.includes(payment as "ALL" | "UNPAID" | "PAID") ? payment as "UNPAID" | "PAID" : "ALL";

  const bills = await db.rentalBill.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(paymentFilter !== "ALL" ? { paymentStatus: paymentFilter } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { rentalContract: { customerName: { contains: q, mode: "insensitive" } } },
              { rentalContract: { phone: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      rentalContract: { select: { id: true, contractNo: true, customerName: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tabs = STATUSES.map((s) => ({ key: s, label: s[0] + s.slice(1).toLowerCase() }));
  const payTabs = PAYMENTS.map((p) => ({ key: p, label: p[0] + p.slice(1).toLowerCase() }));

  function href(nextStatus: string, nextPayment: string, nextQ: string) {
    const params = new URLSearchParams();
    params.set("status", nextStatus);
    params.set("payment", nextPayment);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    return `/admin/rental-bills?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Rental Bills</h1>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {tabs.map((t) => {
          const active = t.key === statusFilter;
          return (
            <Link
              key={t.key}
              href={href(t.key, paymentFilter, q)}
              className={[
                "rounded px-3 py-1 text-sm border",
                active ? "bg-black text-white border-black" : "bg-white",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Payment Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {payTabs.map((t) => {
          const active = t.key === paymentFilter;
          return (
            <Link
              key={t.key}
              href={href(statusFilter, t.key, q)}
              className={[
                "rounded px-3 py-1 text-sm border",
                active ? "bg-black text-white border-black" : "bg-white",
              ].join(" ")}
            >
              Payment: {t.label}
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <form action="/admin/rental-bills" className="mb-4 flex gap-2 items-center">
        <input type="hidden" name="status" value={statusFilter} />
        <input type="hidden" name="payment" value={paymentFilter} />

        <input
          name="q"
          defaultValue={q}
          placeholder="Search by customer name / phone / bill id..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>

        {q && (
          <Link href={href(statusFilter, paymentFilter, "")} className="text-sm underline text-gray-700">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Bill</th>
              <th className="p-3">Contract</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Period</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Total</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-mono">
                  <Link className="underline" href={`/admin/rental-bills/${b.id}`}>
                    #{b.billNo}
                  </Link>
                </td>
                <td className="p-3 font-mono">
                  <Link className="underline" href={`/admin/rentals/${b.rentalContractId}`}>
                    #{b.rentalContract.contractNo}
                  </Link>
                </td>
                <td className="p-3">
                  {b.rentalContract.customerName}
                  {b.rentalContract.phone ? (
                    <div className="text-xs text-gray-500">{b.rentalContract.phone}</div>
                  ) : null}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {new Date(b.periodStart).toLocaleDateString()} → {new Date(b.periodEnd).toLocaleDateString()}
                </td>
                <td className="p-3 font-mono">{b.status}</td>
                <td className="p-3 font-mono">{b.paymentStatus}</td>
                <td className="p-3 font-semibold whitespace-nowrap">৳ {b.total.toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">{new Date(b.createdAt).toLocaleString()}</td>
              </tr>
            ))}

            {bills.length === 0 && (
              <tr>
                <td className="p-3" colSpan={8}>
                  No matching bills.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 mt-3">Showing latest 100 bills.</p>
    </div>
  );
}
