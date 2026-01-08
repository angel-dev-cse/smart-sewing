import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";
import BillActions from "@/app/admin/rentals/[id]/bill-actions";

type Props = { params: Promise<{ id: string }> };

export default async function RentalBillDetailPage({ params }: Props) {
  const { id } = await params;

  const bill = await db.rentalBill.findUnique({
    where: { id },
    include: {
      rentalContract: true,
      items: true,
    },
  });

  if (!bill) notFound();

  const accounts = await db.ledgerAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rental Bill</h1>
          <p className="text-sm text-gray-600">
            Bill: <span className="font-mono">#{bill.billNo}</span>
          </p>
          <p className="text-sm text-gray-600 font-mono break-all">{bill.id}</p>
          <p className="text-sm text-gray-600">
            Status: <span className="font-mono">{bill.status}</span> • Payment:{" "}
            <span className="font-mono">{bill.paymentStatus}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link className="text-sm underline" href="/admin/rental-bills">
            Back
          </Link>

          <Link className="text-sm underline" href={`/admin/rental-bills/${bill.id}/print`}>
            Print
          </Link>

          <BillActions
            billId={bill.id}
            status={bill.status}
            paymentStatus={bill.paymentStatus}
            accounts={accounts}
          />
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-2">Contract</p>
        <p className="text-sm">
          Contract:{" "}
          <Link className="underline font-mono" href={`/admin/rentals/${bill.rentalContractId}`}>
            #{bill.rentalContract.contractNo}
          </Link>
        </p>
        <p className="text-sm text-gray-700">{bill.rentalContract.customerName}</p>
        {bill.rentalContract.phone && <p className="text-sm text-gray-700">{bill.rentalContract.phone}</p>}
      </div>

      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-2">Period</p>
        <p className="text-sm text-gray-700">
          {new Date(bill.periodStart).toLocaleDateString()} → {new Date(bill.periodEnd).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-3">Items</p>
        <ul className="divide-y">
          {bill.items.map((it) => (
            <li key={it.id} className="py-3 flex justify-between">
              <div>
                <p className="font-medium">{it.titleSnapshot}</p>
                <p className="text-sm text-gray-600">
                  Qty {it.quantity} × {formatBdtFromPaisa(it.monthlyRate)} / month
                </p>
              </div>
              <div className="font-semibold">
                {formatBdtFromPaisa(it.monthlyRate * it.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t mt-4 pt-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatBdtFromPaisa(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatBdtFromPaisa(bill.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
