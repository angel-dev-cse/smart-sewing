import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

type TimelineItem = {
  kind: "SALES_INVOICE" | "PURCHASE_BILL" | "RENTAL_CONTRACT" | "RENTAL_BILL";
  id: string;
  label: string;
  status?: string;
  paymentStatus?: string;
  total?: number;
  occurredAt: Date;
  href: string;
};

export default async function PartyDetailPage({ params }: Props) {
  const { id } = await params;

  const party = await db.party.findUnique({
    where: { id },
    include: {
      salesInvoices: true,
      rentalContracts: true,
      purchaseBills: true,
    },
  });

  if (!party) notFound();

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
      label: `Invoice #${s.invoiceNo}`,
      status: s.status,
      paymentStatus: s.paymentStatus,
      total: s.total,
      occurredAt: s.issuedAt ?? s.createdAt,
      href: `/admin/invoices/${s.id}`,
    })),
    ...party.purchaseBills.map((p) => ({
      kind: "PURCHASE_BILL" as const,
      id: p.id,
      label: `Purchase #${p.billNo}`,
      status: p.status,
      paymentStatus: undefined,
      total: p.total,
      occurredAt: p.createdAt,
      href: `/admin/purchase-bills/${p.id}`,
    })),
    ...party.rentalContracts.map((r) => ({
      kind: "RENTAL_CONTRACT" as const,
      id: r.id,
      label: `Rental Contract #${r.contractNo}`,
      status: r.status,
      paymentStatus: undefined,
      total: undefined,
      occurredAt: r.createdAt,
      href: `/admin/rentals/${r.id}`,
    })),
    ...rentalBills.map((b) => ({
      kind: "RENTAL_BILL" as const,
      id: b.id,
      label: `Rental Bill #${b.billNo}`,
      status: b.status,
      paymentStatus: b.paymentStatus,
      total: b.total,
      occurredAt: b.issuedAt ?? b.createdAt,
      href: `/admin/rental-bills/${b.id}`,
    })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contact</h1>
          <p className="text-sm text-gray-600">
            Name: <span className="font-semibold">{party.name}</span>
          </p>
          {party.phone ? <p className="text-sm text-gray-600">Phone: {party.phone}</p> : null}
          {party.email ? <p className="text-sm text-gray-600">Email: {party.email}</p> : null}
          {party.address ? <p className="text-sm text-gray-600">Address: {party.address}</p> : null}
          <p className="text-xs text-gray-500 font-mono break-all mt-2">{party.id}</p>
        </div>

        <Link className="text-sm underline" href="/admin/parties">
          Back
        </Link>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="font-semibold">Timeline</p>
          <p className="text-xs text-gray-600">Latest {timeline.length}</p>
        </div>

        {timeline.length === 0 ? (
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
                {timeline.map((t) => (
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
