"use client";

import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "BANK_TRANSFER";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("Chittagong");
  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [paymentRef, setPaymentRef] = useState("");

  const [deliveryFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (paymentMethod === "COD") setPaymentRef("");
  }, [paymentMethod]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) return setError("Your cart is empty.");

    if (!customerName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim()) {
      return setError("Please fill in name, phone, address, and city.");
    }

    if (paymentMethod !== "COD" && !paymentRef.trim()) {
      return setError("Please enter transaction reference for this payment method.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          paymentMethod,
          deliveryFee,
          notes:
            paymentMethod === "COD"
              ? (notes.trim() || null)
              : `PaymentRef: ${paymentRef.trim()}${notes.trim() ? ` | Notes: ${notes.trim()}` : ""}`,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "Failed to place order.");
        return;
      }

      clearCart();
      router.push(`/order/${data.orderId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="border rounded bg-white p-4 mb-6">
            <p className="font-semibold mb-2">Order summary</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {items.map((it) => (
                <li key={it.productId} className="flex justify-between">
                  <span>
                    {it.title} × {it.quantity}
                  </span>
                  <span>৳ {(it.price * it.quantity).toLocaleString()}</span>
                </li>
              ))}
            </ul>

            <div className="border-t mt-3 pt-3 text-sm flex justify-between">
              <span>Subtotal</span>
              <span>৳ {subtotal.toLocaleString()}</span>
            </div>

            <div className="mt-2 text-sm flex justify-between">
              <span>Delivery fee</span>
              <span>৳ {deliveryFee.toLocaleString()}</span>
            </div>

            <div className="border-t mt-3 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>৳ {total.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={placeOrder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                rows={3}
                placeholder="House/Road/Area"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferred delivery time, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment method</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="COD">Cash on Delivery</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
              </select>
            </div>

            {paymentMethod !== "COD" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Transaction reference (required)
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. bKash TrxID / Nagad Txn ID / Bank ref"
                />
                <p className="text-xs text-gray-600 mt-1">
                  After payment, enter your transaction ID here.
                </p>
              </div>
            )}

            {error && (
              <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {loading ? "Placing order..." : "Place order"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
