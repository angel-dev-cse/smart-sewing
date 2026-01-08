import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";
import PrintButton from "./PrintButton";

type Props = { params: Promise<{ id: string }> };

export default async function RentalBillPrintPage({ params }: Props) {
  const { id } = await params;

  const bill = await db.rentalBill.findUnique({
    where: { id },
    include: {
      rentalContract: true,
      items: true,
    },
  });

  if (!bill) notFound();

  return (
    <div className="space-y-4">
      {/* toolbar - hidden in print */}
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold">Print Rental Bill</h1>
          <p className="text-sm text-gray-600 font-mono">Bill #{bill.billNo}</p>
        </div>
        <PrintButton />
      </div>

      {/* printable content */}
      <div className="bg-white rounded border p-6 print:border-0 print:p-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Smart Sewing Solutions</h2>
          <p className="text-sm text-gray-600">Rental Bill</p>

          <div className="mt-2 text-sm space-y-1">
            <div>
              Bill No: <span className="font-mono">#{bill.billNo}</span>
            </div>
            <div>
              Contract No:{" "}
              <span className="font-mono">#{bill.rentalContract.contractNo}</span>
            </div>
            <div>
              Period: {new Date(bill.periodStart).toLocaleDateString()} →{" "}
              {new Date(bill.periodEnd).toLocaleDateString()}
            </div>
            <div>
              Issued:{" "}
              {bill.issuedAt ? new Date(bill.issuedAt).toLocaleString() : "—"}
            </div>
          </div>
        </div>

        <div className="mb-6 text-sm">
          <p className="font-semibold">Bill To</p>
          <p>{bill.rentalContract.customerName}</p>
          {bill.rentalContract.phone && <p>{bill.rentalContract.phone}</p>}
          {bill.rentalContract.addressLine1 && <p>{bill.rentalContract.addressLine1}</p>}
          {bill.rentalContract.city && <p>{bill.rentalContract.city}</p>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Rate</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((it) => (
                <tr key={it.id} className="border-b">
                  <td className="py-2">{it.titleSnapshot}</td>
                  <td className="py-2">{it.quantity}</td>
                  <td className="py-2">{formatBdtFromPaisa(it.monthlyRate)}</td>
                  <td className="py-2 text-right font-semibold">
                    {formatBdtFromPaisa(it.monthlyRate * it.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm text-sm space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatBdtFromPaisa(bill.subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatBdtFromPaisa(bill.total)}</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          This is a computer-generated bill.
        </p>
      </div>
    </div>
  );
}
