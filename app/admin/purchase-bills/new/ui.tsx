"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  stock: number;
  price: number;
};

type Item = Product & { qty: number; cost: number };

export default function PurchaseClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addProduct(p: Product) {
    setItems((prev) => {
      const f = prev.find((i) => i.id === p.id);
      if (f) return prev.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1, cost: p.price }];
    });
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.cost, 0);

  async function submit() {
    setError(null);
    if (!supplierName.trim()) return setError("Supplier name required");
    if (items.length === 0) return setError("Add at least one product");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/purchase-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName,
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.qty,
            unitCost: i.cost,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/admin/purchase-bills/${data.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border p-3 rounded">
        <p className="font-semibold mb-2">Products</p>
        {products.map((p) => (
          <button key={p.id} onClick={() => addProduct(p)} className="block underline">
            {p.title}
          </button>
        ))}
      </div>

      <div className="border p-3 rounded space-y-2">
        <input
          className="w-full border px-2 py-1"
          placeholder="Supplier name"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
        />

        {items.map((i) => (
          <div key={i.id} className="flex gap-2">
            <span className="flex-1">{i.title}</span>
            <input
              type="number"
              value={i.qty}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x) => x.id === i.id ? { ...x, qty: +e.target.value } : x)
                )
              }
              className="w-16 border"
            />
            <input
              type="number"
              value={i.cost}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x) => x.id === i.id ? { ...x, cost: +e.target.value } : x)
                )
              }
              className="w-20 border"
            />
          </div>
        ))}

        <div className="font-bold border-t pt-2">Total: ৳ {subtotal}</div>

        {error && <p className="text-red-700">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white py-2"
        >
          {loading ? "Saving..." : "Save Purchase"}
        </button>
      </div>
    </div>
  );
}
