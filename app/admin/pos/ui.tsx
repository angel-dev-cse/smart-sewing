"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  price: number;
  stock: number;
};

type Item = Product & { qty: number };

type PosPay = "CASH" | "BKASH" | "NAGAD" | "BANK_TRANSFER";

export default function PosClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosPay>("CASH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addProduct(p: Product) {
    setItems((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) {
        return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...p, qty: 1 }];
    });
  }

  function updateQty(id: string, qty: number) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  async function submit() {
    setError(null);

    if (items.length === 0) {
      setError("Add at least one product.");
      return;
    }

    // basic guard: prevent qty 0/negative
    if (items.some((i) => !Number.isFinite(i.qty) || i.qty < 1)) {
      setError("Quantity must be at least 1 for all items.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || "Walk-in customer",
          phone: phone || null,
          paymentMethod, // "CASH" | "BKASH" | "NAGAD" | "BANK_TRANSFER"
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.qty,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");

      router.push(`/admin/invoices/${data.invoiceId}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Product list */}
      <div className="border rounded p-3">
        <p className="font-semibold mb-2">Products</p>
        <ul className="space-y-1 max-h-[400px] overflow-y-auto">
          {products.map((p) => (
            <li key={p.id} className="flex justify-between">
              <button onClick={() => addProduct(p)} className="underline text-left">
                {p.title}
              </button>
              <span className="text-sm text-gray-600">
                ৳ {p.price} | stk {p.stock}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bill */}
      <div className="border rounded p-3 space-y-3">
        <p className="font-semibold">Bill</p>

        {items.map((i) => (
          <div key={i.id} className="flex justify-between items-center gap-2">
            <span className="flex-1">{i.title}</span>
            <input
              type="number"
              min={1}
              className="w-16 border px-1"
              value={i.qty}
              onChange={(e) => updateQty(i.id, Number(e.target.value))}
            />
            <span>৳ {i.price * i.qty}</span>
            <button onClick={() => remove(i.id)}>✕</button>
          </div>
        ))}

        <div className="border-t pt-2 font-bold">Total: ৳ {subtotal}</div>

        <input
          placeholder="Customer name (optional)"
          className="w-full border px-2 py-1"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <input
          placeholder="Phone (optional)"
          className="w-full border px-2 py-1"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <select
          className="w-full border px-2 py-1"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PosPay)}
        >
          <option value="CASH">Cash</option>
          <option value="BKASH">Bkash</option>
          <option value="NAGAD">Nagad</option>
          <option value="BANK_TRANSFER">Bank</option>
        </select>

        {error && <p className="text-red-700 text-sm">{error}</p>}

        <button onClick={submit} disabled={loading} className="w-full bg-black text-white py-2">
          {loading ? "Processing..." : "Complete Sale"}
        </button>
      </div>
    </div>
  );
}
