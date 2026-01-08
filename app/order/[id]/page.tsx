import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatBdtFromPaisa } from "@/lib/money";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Order placed ✅</h1>

      <div className="rounded border bg-white p-4 space-y-2">
        <p className="text-sm text-gray-600">
          Order ID: <span className="font-mono">{order.id}</span>
        </p>

        <p>
          <span className="font-semibold">Status:</span> {order.status}
        </p>

        <p>
          <span className="font-semibold">Payment:</span> {order.paymentMethod} •{" "}
          {order.paymentStatus}
        </p>

        <p>
          <span className="font-semibold">Total:</span> {formatBdtFromPaisa(order.total)}
        </p>

        {order.notes && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Notes:</span> {order.notes}
          </p>
        )}
      </div>

      <div className="rounded border bg-white p-4">
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

        <div className="border-t mt-3 pt-3 font-bold flex justify-between">
          <span>Total</span>
          <span>{formatBdtFromPaisa(order.total)}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Link className="underline" href="/shop">
          Continue shopping
        </Link>
        <Link className="underline" href="/cart">
          View cart
        </Link>
      </div>

      <p className="text-xs text-gray-600">
        Note: For bKash/Nagad/Bank transfers, we’ll verify your payment and update the status.
      </p>
    </div>
  );
}
