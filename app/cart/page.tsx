"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatBdt } from "@/lib/money";

export default function CartPage() {
  const { items, removeItem, clearCart } = useCart();

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Cart</h1>
        <p className="text-gray-700">Your cart is empty.</p>
        <Link href="/shop" className="underline mt-4 inline-block">
          Go to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Cart</h1>

      <div className="border rounded bg-white">
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.productId} className="p-4 flex justify-between gap-4">
              <div>
                <p className="font-semibold">{it.title}</p>
                <p className="text-sm text-gray-600">
                  Qty: {it.quantity} × {formatBdt(it.price)}
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  Line total: {formatBdt(it.price * it.quantity)}
                </p>

                <div className="mt-2 flex gap-3 text-sm">
                  <Link href={`/p/${it.slug}`} className="underline text-gray-700">
                    View
                  </Link>
                  <button
                    onClick={() => removeItem(it.productId)}
                    className="underline text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="font-semibold">{formatBdt(it.price * it.quantity)}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex justify-between font-bold">
        <span>Subtotal</span>
        <span>{formatBdt(subtotal)}</span>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={clearCart}
          className="rounded border px-4 py-2"
        >
          Clear cart
        </button>

        <Link
          href="/checkout"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
