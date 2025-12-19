import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import AdminOrderActions from "./ui";
import OrderInvoiceActions from "./invoice-actions";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order</h1>
          <p className="text-sm text-gray-600 font-mono">{order.id}</p>
          <p className="text-sm text-gray-600">
            {new Date(order.createdAt).toLocaleString()}
          </p>

          {/* NEW: Invoice actions (generate/open/print) */}
          <div className="mt-3">
            <OrderInvoiceActions
              orderId={order.id}
              status={order.status}
              salesInvoiceId={order.salesInvoiceId ?? null}
            />
          </div>
        </div>

        <AdminOrderActions
          orderId={order.id}
          status={order.status}
          paymentStatus={order.paymentStatus}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded border bg-white p-4">
          <p className="font-semibold mb-2">Customer</p>
          <p>{order.customerName}</p>
          <p className="text-sm text-gray-700">{order.phone}</p>
          <p className="text-sm text-gray-700 mt-2">{order.addressLine1}</p>
          <p className="text-sm text-gray-700">{order.city}</p>
          {order.notes && (
            <p className="text-sm text-gray-600 mt-2">Notes: {order.notes}</p>
          )}
        </div>

        <div className="rounded border bg-white p-4">
          <p className="font-semibold mb-2">Payment</p>
          <p className="text-sm text-gray-700">
            Method: <span className="font-mono">{order.paymentMethod}</span>
          </p>
          <p className="text-sm text-gray-700">
            Payment status: <span className="font-mono">{order.paymentStatus}</span>
          </p>

          <div className="border-t mt-4 pt-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>৳ {order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery fee</span>
              <span>৳ {order.deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>৳ {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-3">Items</p>
        <ul className="divide-y">
          {order.items.map((it) => (
            <li key={it.id} className="py-3 flex justify-between">
              <div>
                <p className="font-medium">{it.titleSnapshot}</p>
                <p className="text-sm text-gray-600">
                  Qty {it.quantity} × ৳ {it.unitPrice.toLocaleString()}
                </p>
              </div>
              <div className="font-semibold">
                ৳ {(it.unitPrice * it.quantity).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-600">
        Current status: <span className="font-mono">{order.status}</span>
      </div>
    </div>
  );
}
