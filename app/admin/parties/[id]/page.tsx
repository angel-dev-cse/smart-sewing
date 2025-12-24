import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ q?: string; kind?: string }>;
};

type TimelineItem = {
  kind:
    | "SALES_INVOICE"
    | "PURCHASE_BILL"
    | "PURCHASE_RETURN"
    | "RENTAL_CONTRACT"
    | "RENTAL_BILL"
    | "SALES_RETURN";
  id: string;
  label: string;
  status?: string;
  paymentStatus?: string;
  total?: number;
  occurredAt: Date;
  href: string;
};

export default async function PartyDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const q = String(sp.q ?? "").trim();
  const kind = String(sp.kind ?? "ALL").toUpperCase();

  const party = await db.party.findUnique({
    where: { id },
    include: {
      salesInvoices: true,
      rentalContracts: true,
      purchaseBills: true,
      salesReturns: true,
      purchaseReturns: true,
    },
  });

  if (!party) notFound();

  // TypeScript needs this assertion after the notFound() check
  const partyData = party;

  const KIND_TABS = [
    { key: "ALL", label: "All" },
    { key: "SALES_INVOICE", label: "Sales" },
    { key: "SALES_RETURN", label: "Sales returns" },
    { key: "PURCHASE_BILL", label: "Purchases" },
    { key: "PURCHASE_RETURN", label: "Purchase returns" },
    { key: "RENTAL_CONTRACT", label: "Rentals" },
    { key: "RENTAL_BILL", label: "Rental bills" },
  ] as const;

  const kindFilter = (KIND_TABS.some((t) => t.key === kind) ? kind : "ALL") as (typeof KIND_TABS)[number]["key"];

  const pad6 = (n: number) => String(n).padStart(6, "0");

  // Rental bills are linked to a contract, not directly to party.
  const contractIds = party.rentalContracts.map((c) => c.id);
  const rentalBills =
    contractIds.length === 0
      ? []
      : await db.rentalBill.findMany({
          where: { rentalContractId: { in: contractIds } },
          orderBy: { createdAt: "desc" },
          take: 200,
        });

  const timeline: TimelineItem[] = [
    ...party.salesInvoices.map((s) => ({
      kind: "SALES_INVOICE" as const,
      id: s.id,
      label: `INV-${pad6(s.invoiceNo)}`,
      status: s.status,
      paymentStatus: s.paymentStatus,
      total: s.total,
      occurredAt: s.issuedAt ?? s.createdAt,
      href: `/admin/invoices/${s.id}`,
    })),
    ...party.purchaseBills.map((p) => ({
      kind: "PURCHASE_BILL" as const,
      id: p.id,
      label: `PB-${pad6(p.billNo)}`,
      status: p.status,
      paymentStatus: undefined,
      total: p.total,
      occurredAt: p.createdAt,
      href: `/admin/purchase-bills/${p.id}`,
    })),
    ...party.purchaseReturns.map((r) => ({
      kind: "PURCHASE_RETURN" as const,
      id: r.id,
      label: `PR-${pad6(r.returnNo)}`,
      status: r.status,
      paymentStatus: undefined,
      total: r.total,
      occurredAt: r.issuedAt ?? r.createdAt,
      href: `/admin/purchase-returns/${r.id}`,
    })),
    ...party.salesReturns.map((r) => ({
      kind: "SALES_RETURN" as const,
      id: r.id,
      label: `SR-${pad6(r.returnNo)}`,
      status: r.status,
      paymentStatus: undefined,
      total: r.total,
      occurredAt: r.issuedAt ?? r.createdAt,
      href: `/admin/sales-returns/${r.id}`,
    })),
    ...party.rentalContracts.map((r) => ({
      kind: "RENTAL_CONTRACT" as const,
      id: r.id,
      label: `RC-${pad6(r.contractNo)}`,
      status: r.status,
      paymentStatus: undefined,
      total: undefined,
      occurredAt: r.createdAt,
      href: `/admin/rentals/${r.id}`,
    })),
    ...rentalBills.map((b) => ({
      kind: "RENTAL_BILL" as const,
      id: b.id,
      label: `RB-${pad6(b.billNo)}`,
      status: b.status,
      paymentStatus: b.paymentStatus,
      total: b.total,
      occurredAt: b.issuedAt ?? b.createdAt,
      href: `/admin/rental-bills/${b.id}`,
    })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  const filtered = timeline.filter((t) => {
    if (kindFilter !== "ALL" && t.kind !== kindFilter) return false;
    if (!q) return true;
    const hay = `${t.label} ${t.kind} ${t.status ?? ""} ${t.paymentStatus ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  function href(nextKind: string, nextQ: string) {
    const params = new URLSearchParams();
    if (nextKind && nextKind !== "ALL") params.set("kind", nextKind);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    const qs = params.toString();
    return qs ? `/admin/parties/${partyData.id}?${qs}` : `/admin/parties/${partyData.id}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contact</h1>
          <p className="text-sm text-gray-600">
            Name: <span className="font-semibold">{party.name}</span>
          </p>
          <p className="text-sm text-gray-600">Type: <span className="font-mono">{party.type}</span></p>
          {party.phone ? <p className="text-sm text-gray-600">Phone: {party.phone}</p> : null}
          {party.email ? <p className="text-sm text-gray-600">Email: {party.email}</p> : null}
          {party.address ? <p className="text-sm text-gray-600">Address: {party.address}</p> : null}
          {party.companyName ? <p className="text-sm text-gray-600">Company: {party.companyName}</p> : null}

          {party.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {party.tags.map((t) => (
                <span key={t} className="text-xs rounded border px-2 py-0.5 bg-white">
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-gray-500 font-mono break-all mt-2">{party.id}</p>
        </div>

        <Link className="text-sm underline" href="/admin/parties">
          Back
        </Link>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="font-semibold">Timeline</p>
          <p className="text-xs text-gray-600">Showing {filtered.length} / {timeline.length}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {KIND_TABS.map((t) => {
            const active = t.key === kindFilter;
            return (
              <Link
                key={t.key}
                href={href(t.key, q)}
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

        <form action={href(kindFilter, "")} className="mb-4 flex gap-2 items-center">
          {kindFilter !== "ALL" ? <input type="hidden" name="kind" value={kindFilter} /> : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search docs (INV/PB/RC/RB, status...)"
            className="w-full max-w-md border rounded px-3 py-2 text-sm"
          />
          <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>
          {q ? (
            <Link href={href(kindFilter, "")} className="text-sm underline text-gray-700">
              Clear
            </Link>
          ) : null}
        </form>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-600">No linked documents yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Document</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={`${t.kind}-${t.id}`} className="border-t">
                    <td className="p-3 whitespace-nowrap">{t.occurredAt.toLocaleString()}</td>
                    <td className="p-3 font-mono">{t.kind}</td>
                    <td className="p-3">
                      <Link className="underline" href={t.href}>
                        {t.label}
                      </Link>
                    </td>
                    <td className="p-3 font-mono">{t.status ?? "—"}</td>
                    <td className="p-3 font-mono">{t.paymentStatus ?? "—"}</td>
                    <td className="p-3 text-right font-semibold">
                      {typeof t.total === "number" ? `৳ ${t.total.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-2">Linked counts</p>
        <div className="text-sm text-gray-700 space-y-1">
          <div>Sales invoices: {party.salesInvoices.length}</div>
          <div>Purchase bills: {party.purchaseBills.length}</div>
          <div>Rental contracts: {party.rentalContracts.length}</div>
          <div>Rental bills: {rentalBills.length}</div>
        </div>
      </div>
    </div>
  );
}
