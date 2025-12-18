import Link from "next/link";
import { db } from "@/lib/db";

type Props = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const status = sp.status ?? "PENDING"; // default tab
  const q = (sp.q ?? "").trim();

  const statusFilter =
    status === "ALL"
      ? undefined
      : status === "PENDING" || status === "CONFIRMED" || status === "CANCELLED"
      ? status
      : "PENDING";

  const orders = await db.order.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter as any } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });

  const tabs = [
    { key: "PENDING", label: "Pending" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "CANCELLED", label: "Cancelled" },
    { key: "ALL", label: "All" },
  ];

  function tabHref(nextStatus: string) {
    const params = new URLSearchParams();
    params.set("status", nextStatus);
    if (q) params.set("q", q);
    return `/admin/orders?${params.toString()}`;
  }

  function searchHref(nextQ: string) {
    const params = new URLSearchParams();
    params.set("status", status);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    return `/admin/orders?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => {
          const active = t.key === status;
          return (
            <Link
              key={t.key}
              href={tabHref(t.key)}
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

      {/* Search */}
      <form
        action="/admin/orders"
        className="mb-4 flex gap-2 items-center"
      >
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by phone or order id..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">
          Search
        </button>

        {q && (
          <Link
            href={searchHref("")}
            className="text-sm underline text-gray-700"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Created</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Total</th>
              <th className="p-3">Items</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleString()}
                </td>

                <td className="p-3">
                  <Link className="underline" href={`/admin/orders/${o.id}`}>
                    {o.customerName}
                  </Link>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    {o.id.slice(0, 10)}…
                  </div>
                </td>

                <td className="p-3 whitespace-nowrap">{o.phone}</td>

                <td className="p-3 whitespace-nowrap">{o.status}</td>

                <td className="p-3 whitespace-nowrap">
                  {o.paymentStatus} ({o.paymentMethod})
                </td>

                <td className="p-3 whitespace-nowrap font-semibold">
                  ৳ {o.total.toLocaleString()}
                </td>

                <td className="p-3 whitespace-nowrap">{o.items.length}</td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td className="p-3" colSpan={7}>
                  No matching orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 mt-3">
        Showing latest 50 orders.
      </p>
    </div>
  );
}
