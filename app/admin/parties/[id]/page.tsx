import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PartyDetailPage({ params }: Props) {
  const { id } = await params;

  const party = await db.party.findUnique({
    where: { id },
    include: {
      salesInvoices: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      purchaseBills: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      rentalContracts: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!party) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Party</h1>
          <p className="text-sm text-gray-600 font-mono break-all">{party.id}</p>
          <p className="text-sm text-gray-600">
            Type: <span className="font-mono">{party.type}</span>
          </p>
          <p className="text-sm text-gray-600">
            Active: <span className="font-mono">{party.isActive ? "YES" : "NO"}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link className="text-sm underline" href="/admin/parties">
            Back
          </Link>
        </div>
      </div>

      <div className="rounded border bg-white p-4 space-y-1">
        <p className="font-semibold text-lg">{party.name}</p>
        {party.phone ? <p className="text-sm text-gray-700">📞 {party.phone}</p> : null}
        {party.email ? <p className="text-sm text-gray-700">✉️ {party.email}</p> : null}
        {party.address ? <p className="text-sm text-gray-700">📍 {party.address}</p> : null}
        {party.notes ? <p className="text-sm text-gray-600 mt-2">Notes: {party.notes}</p> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded border bg-white p-4">
          <p className="font-semibold mb-2">Sales Invoices</p>
          {party.salesInvoices.length === 0 ? (
            <p className="text-sm text-gray-600">None.</p>
          ) : (
            <ul className="divide-y">
              {party.salesInvoices.map((inv) => (
                <li key={inv.id} className="py-2 text-sm flex items-center justify-between gap-2">
                  <Link className="underline font-mono" href={`/admin/invoices/${inv.id}`}>
                    #{inv.invoiceNo}
                  </Link>
                  <span className="font-mono text-xs text-gray-600">{inv.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border bg-white p-4">
          <p className="font-semibold mb-2">Purchase Bills</p>
          {party.purchaseBills.length === 0 ? (
            <p className="text-sm text-gray-600">None.</p>
          ) : (
            <ul className="divide-y">
              {party.purchaseBills.map((pb) => (
                <li key={pb.id} className="py-2 text-sm flex items-center justify-between gap-2">
                  <Link className="underline font-mono" href={`/admin/purchases/${pb.id}`}>
                    #{pb.billNo}
                  </Link>
                  <span className="font-mono text-xs text-gray-600">{pb.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border bg-white p-4">
          <p className="font-semibold mb-2">Rental Contracts</p>
          {party.rentalContracts.length === 0 ? (
            <p className="text-sm text-gray-600">None.</p>
          ) : (
            <ul className="divide-y">
              {party.rentalContracts.map((rc) => (
                <li key={rc.id} className="py-2 text-sm flex items-center justify-between gap-2">
                  <Link className="underline font-mono" href={`/admin/rentals/${rc.id}`}>
                    #{rc.contractNo}
                  </Link>
                  <span className="font-mono text-xs text-gray-600">{rc.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
