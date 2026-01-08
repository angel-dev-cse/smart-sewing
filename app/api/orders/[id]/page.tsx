import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatBdtFromPaisa } from "@/lib/money";

type Props = { params: Promise<{ id: string }> };

export default async function OrderSuccessPage({ params }: Props) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Order placed ✅</h1>

      <p className="text-gray-700">
        Order ID: <span className="font-mono">{order.id}</span>
      </p>

      <div className="mt-6 border rounded bg-white p-4">
        <p className="font-semibold mb-2">Delivery</p>
        <p className="text-sm text-gray-700">
          {order.customerName} — {order.phone}
        </p>
        <p className="text-sm text-gray-700">{order.addressLine1}</p>
        <p className="text-sm text-gray-700">{order.city}</p>
        {order.notes && <p className="text-sm text-gray-600 mt-2">Notes: {order.notes}</p>}

        <div className="border-t mt-4 pt-4">
          <p className="font-semibold mb-2">Items</p>
          <ul className="text-sm space-y-1">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>
                  {it.titleSnapshot} × {it.quantity}
                </span>
                <span>{formatBdtFromPaisa(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="border-t mt-3 pt-3 text-sm flex justify-between">
            <span>Subtotal</span>
            <span>{formatBdtFromPaisa(order.subtotal)}</span>
          </div>

          <div className="mt-2 text-sm flex justify-between">
            <span>Delivery fee</span>
            <span>{formatBdtFromPaisa(order.deliveryFee)}</span>
          </div>

          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatBdtFromPaisa(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Link href="/shop" className="underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
