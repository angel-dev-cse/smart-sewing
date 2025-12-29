import Link from "next/link";
import { db } from "@/lib/db";

const TZ = "Asia/Dhaka";

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString();
}

function ymdInTz(d: Date) {
  // en-CA => YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function ymInTz(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

function startOfBdDay(d: Date) {
  const ymd = ymdInTz(d);
  return new Date(`${ymd}T00:00:00+06:00`);
}

function startOfBdNextDay(d: Date) {
  // Bangladesh has no DST; adding 24h is safe.
  return new Date(startOfBdDay(d).getTime() + 24 * 60 * 60 * 1000);
}

function startOfBdMonth(d: Date) {
  const ym = ymInTz(d);
  return new Date(`${ym}-01T00:00:00+06:00`);
}

function startOfNextBdMonth(d: Date) {
  const ym = ymInTz(d);
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return new Date(
    `${String(nextY)}-${String(nextM).padStart(2, "0")}-01T00:00:00+06:00`
  );
}

export default async function AdminReportsPage() {
  const now = new Date();
  const startToday = startOfBdDay(now);
  const startTomorrow = startOfBdNextDay(now);
  const startMonth = startOfBdMonth(now);
  const startNextMonth = startOfNextBdMonth(now);

  const [
    salesToday,
    salesMonth,
    salesReturnsToday,
    salesReturnsMonth,
    rentalMonth,
    rentalUnpaid,
    unpaidSales,
    unpaidSalesList,
    lowStock,
    accounts,
  ] = await Promise.all([
    db.salesInvoice.aggregate({
      where: {
        status: "ISSUED",
        issuedAt: { gte: startToday, lt: startTomorrow },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.salesInvoice.aggregate({
      where: {
        status: "ISSUED",
        issuedAt: { gte: startMonth, lt: startNextMonth },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.salesReturn.aggregate({
      where: {
        status: "ISSUED",
        issuedAt: { gte: startToday, lt: startTomorrow },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.salesReturn.aggregate({
      where: {
        status: "ISSUED",
        issuedAt: { gte: startMonth, lt: startNextMonth },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.rentalBill.aggregate({
      where: {
        status: "ISSUED",
        issuedAt: { gte: startMonth, lt: startNextMonth },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.rentalBill.count({
      where: {
        status: "ISSUED",
        paymentStatus: "UNPAID",
      },
    }),
    db.salesInvoice.count({
      where: {
        status: "ISSUED",
        paymentStatus: { in: ["UNPAID", "PARTIAL"] },
      },
    }),
    db.salesInvoice.findMany({
      where: {
        status: "ISSUED",
        paymentStatus: { in: ["UNPAID", "PARTIAL"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        invoiceNo: true,
        customerName: true,
        phone: true,
        total: true,
        paymentStatus: true,
        issuedAt: true,
        createdAt: true,
      },
    }),
    (async () => {
      const rawProducts = await db.product.findMany({
        where: { isActive: true, stock: { lte: 2 } },
        orderBy: [{ stock: "asc" }, { title: "asc" }],
        take: 25,
        select: { id: true, title: true, stock: true, price: true },
      });
      // Convert prices from paisa to BDT for display
      return rawProducts.map(product => ({
        ...product,
        price: product.price / 100, // Convert from paisa to BDT
      }));
    })(),
    db.ledgerAccount.findMany({
      where: { isActive: true },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      select: { id: true, name: true, kind: true, openingBalance: true },
    }),
  ]);

  const accountIds = accounts.map((a) => a.id);

  const [ledgerAll, ledgerToday] = await Promise.all([
    db.ledgerEntry.groupBy({
      by: ["accountId", "direction"],
      where: { accountId: { in: accountIds } },
      _sum: { amount: true },
    }),
    db.ledgerEntry.groupBy({
      by: ["accountId", "direction"],
      where: {
        accountId: { in: accountIds },
        occurredAt: { gte: startToday, lt: startTomorrow },
      },
      _sum: { amount: true },
    }),
  ]);

  const byAcctAll = new Map<string, { IN: number; OUT: number }>();
  for (const row of ledgerAll) {
    const cur = byAcctAll.get(row.accountId) ?? { IN: 0, OUT: 0 };
    const amt = row._sum.amount ?? 0;
    cur[row.direction] = amt;
    byAcctAll.set(row.accountId, cur);
  }

  const byAcctToday = new Map<string, { IN: number; OUT: number }>();
  for (const row of ledgerToday) {
    const cur = byAcctToday.get(row.accountId) ?? { IN: 0, OUT: 0 };
    const amt = row._sum.amount ?? 0;
    cur[row.direction] = amt;
    byAcctToday.set(row.accountId, cur);
  }

  const grossToday = salesToday._sum.total ?? 0;
  const grossMonth = salesMonth._sum.total ?? 0;
  const returnsToday = salesReturnsToday._sum.total ?? 0;
  const returnsMonth = salesReturnsMonth._sum.total ?? 0;
  const netToday = Math.max(0, grossToday - returnsToday);
  const netMonth = Math.max(0, grossMonth - returnsMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports (MVP)</h1>
        <Link className="underline" href="/admin/ledger">
          View ledger
        </Link>
      </div>

      <div className="text-sm text-gray-600">
        Timezone: {TZ}. Today: {ymdInTz(now)}
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-600">Today sales (gross)</div>
          <div className="text-xl font-bold">৳ {money(grossToday)}</div>
          <div className="text-xs text-gray-600">Invoices: {salesToday._count._all}</div>
        </div>

        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-600">Today sales (net)</div>
          <div className="text-xl font-bold">৳ {money(netToday)}</div>
          <div className="text-xs text-gray-600">Returns: ৳ {money(returnsToday)}</div>
        </div>

        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-600">This month sales (net)</div>
          <div className="text-xl font-bold">৳ {money(netMonth)}</div>
          <div className="text-xs text-gray-600">Returns: ৳ {money(returnsMonth)}</div>
        </div>

        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-600">This month rental income</div>
          <div className="text-xl font-bold">৳ {money(rentalMonth._sum.total)}</div>
          <div className="text-xs text-gray-600">Unpaid rental bills: {rentalUnpaid}</div>
        </div>
      </div>

      {/* Cash / bKash / Bank summary */}
      <div className="rounded border bg-white p-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Cash / bKash / Bank summary</h2>
          <Link className="text-sm underline" href="/admin/ledger">
            Open ledger
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-2">Account</th>
                <th className="p-2">Kind</th>
                <th className="p-2">Today net</th>
                <th className="p-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const all = byAcctAll.get(a.id) ?? { IN: 0, OUT: 0 };
                const today = byAcctToday.get(a.id) ?? { IN: 0, OUT: 0 };
                const balance = (a.openingBalance ?? 0) + all.IN - all.OUT;
                const todayNet = today.IN - today.OUT;
                return (
                  <tr key={a.id} className="border-t">
                    <td className="p-2">{a.name}</td>
                    <td className="p-2 font-mono">{a.kind}</td>
                    <td className="p-2 font-mono">{todayNet >= 0 ? "+" : ""}৳ {money(todayNet)}</td>
                    <td className="p-2 font-semibold whitespace-nowrap">৳ {money(balance)}</td>
                  </tr>
                );
              })}

              {accounts.length === 0 && (
                <tr>
                  <td className="p-2" colSpan={4}>
                    No ledger accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unpaid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded border bg-white p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Unpaid / partial sales invoices</h2>
            <Link className="text-sm underline" href="/admin/invoices?status=ISSUED&payment=ALL">
              Open invoices
            </Link>
          </div>
          <div className="text-sm text-gray-600 mt-1">Count: {unpaidSales}</div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2">Invoice</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {unpaidSalesList.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="p-2 font-mono">
                      <Link className="underline" href={`/admin/invoices/${inv.id}`}>
                        INV-{String(inv.invoiceNo).padStart(6, "0")}
                      </Link>
                    </td>
                    <td className="p-2">
                      {inv.customerName}
                      {inv.phone ? <div className="text-xs text-gray-500">{inv.phone}</div> : null}
                    </td>
                    <td className="p-2 font-mono">{inv.paymentStatus}</td>
                    <td className="p-2 font-semibold whitespace-nowrap">৳ {money(inv.total)}</td>
                  </tr>
                ))}

                {unpaidSalesList.length === 0 && (
                  <tr>
                    <td className="p-2" colSpan={4}>
                      No unpaid/partial invoices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded border bg-white p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Low stock (≤ 2)</h2>
            <Link className="text-sm underline" href="/admin/products">
              Open products
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2">Product</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.title}</td>
                    <td className="p-2 font-mono">{p.stock}</td>
                    <td className="p-2 whitespace-nowrap">৳ {money(p.price)}</td>
                  </tr>
                ))}

                {lowStock.length === 0 && (
                  <tr>
                    <td className="p-2" colSpan={3}>
                      No low stock items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600">
        Note: This is an MVP dashboard. As Phase 9 adds multi-user/security, we can scope reports per org/user.
      </div>
    </div>
  );
}
