import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import RentalActions from "./ui";
import BillActions from "./bill-actions";


type Props = { params: Promise<{ id: string }> };

export default async function RentalDetailPage({ params }: Props) {
  const { id } = await params;

  const contract = await db.rentalContract.findUnique({
    where: { id },
    include: {
      party: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { title: true, stock: true } },
        },
      },
      bills: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  const accounts = await db.ledgerAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true },
  });


  if (!contract) notFound();

  const monthlyTotal = contract.items.reduce(
    (sum, it) => sum + it.monthlyRate * it.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rental Contract</h1>
          <p className="text-sm text-gray-600">
            Contract: <span className="font-mono">#{contract.contractNo}</span>
          </p>
          <p className="text-sm text-gray-600 font-mono break-all">{contract.id}</p>
          <p className="text-sm text-gray-600">
            Created: {new Date(contract.createdAt).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Status: <span className="font-mono">{contract.status}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link className="text-sm underline" href="/admin/rentals">
            Back
          </Link>

          <RentalActions
            contractId={contract.id}
            status={contract.status}
          />
        </div>
      </div>

      {/* Customer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded border bg-white p-4">
          <p className="font-semibold mb-2">Customer</p>
          <p>{contract.customerName}</p>
          {contract.party ? (
            <p className="text-xs text-gray-600 mt-1">
              Linked contact:{" "}
              <Link className="underline" href={`/admin/parties/${contract.party.id}`}>
                {contract.party.name}
              </Link>
            </p>
          ) : null}
          {contract.phone && <p className="text-sm text-gray-700">{contract.phone}</p>}
          {contract.addressLine1 && (
            <p className="text-sm text-gray-700 mt-2">{contract.addressLine1}</p>
          )}
          {contract.city && <p className="text-sm text-gray-700">{contract.city}</p>}
          {contract.notes && (
            <p className="text-sm text-gray-600 mt-2">Notes: {contract.notes}</p>
          )}
        </div>

        <div className="rounded border bg-white p-4">
          <p className="font-semibold mb-2">Terms</p>
          <p className="text-sm text-gray-700">
            Start: {new Date(contract.startDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-700">
            End: {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "—"}
          </p>

          <div className="border-t mt-4 pt-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Deposit</span>
              <span className="font-semibold">৳ {contract.deposit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly total</span>
              <span className="font-semibold">৳ {monthlyTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-3">Rented items</p>
        <ul className="divide-y">
          {contract.items.map((it) => (
            <li key={it.id} className="py-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{it.titleSnapshot}</p>
                <p className="text-sm text-gray-600">
                  Qty {it.quantity} × ৳ {it.monthlyRate.toLocaleString()} / month
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current stock: {it.product.stock}
                </p>
              </div>
              <div className="font-semibold">
                ৳ {(it.monthlyRate * it.quantity).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bills */}
      <div className="rounded border bg-white p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="font-semibold">Monthly bills</p>
          <p className="text-xs text-gray-600">Latest 50</p>
        </div>

        {contract.bills.length === 0 ? (
          <p className="text-sm text-gray-600">No bills yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Bill</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contract.bills.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="p-3 font-mono">
                      <Link className="underline" href={`/admin/rental-bills/${b.id}`}>
                        #{b.billNo}
                      </Link>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {new Date(b.periodStart).toLocaleDateString()} →{" "}
                      {new Date(b.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono">{b.status}</td>
                    <td className="p-3 font-mono">{b.paymentStatus}</td>
                    <td className="p-3 font-semibold whitespace-nowrap">
                      ৳ {b.total.toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right">
                      <BillActions
                        billId={b.id}
                        status={b.status}
                        paymentStatus={b.paymentStatus}
                        accounts={accounts}
                      />

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate bill UI */}
      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-2">Generate a bill (MVP)</p>
        <p className="text-sm text-gray-600 mb-3">
          Pick a period. We’ll make this smarter later (auto-month ranges + “next unpaid month”).
        </p>

        <RentalActions
          contractId={contract.id}
          status={contract.status}
          showBillGenerator
        />
      </div>
    </div>
  );
}
