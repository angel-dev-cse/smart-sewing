"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  stock: number;
  price: number;
};

type SelectedItem = {
  productId: string;
  title: string;
  unitValue: number;
  quantity: number;
};

export default function NewWriteOffUI({
  products,
}: {
  products: Product[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  function addProduct(p: Product) {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === p.id);
      if (found) {
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { productId: p.id, title: p.title, unitValue: p.price, quantity: 1 },
      ];
    });
  }

  function updateQty(productId: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  }

  function remove(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const totalValue = items.reduce((sum, i) => sum + i.unitValue * i.quantity, 0);

  async function submit() {
    setError(null);
    if (items.length === 0) {
      setError("Add at least one product.");
      return;
    }

    const cleaned = items.map((i) => ({
      productId: i.productId,
      quantity: Number(i.quantity),
    }));

    for (const it of cleaned) {
      if (!it.productId) {
        setError("Invalid product.");
        return;
      }
      if (!Number.isFinite(it.quantity) || it.quantity < 1) {
        setError("Quantity must be at least 1.");
        return;
      }

      const p = byId.get(it.productId);
      if (!p) {
        setError("Product not found.");
        return;
      }
      if (it.quantity > p.stock) {
        setError(`Cannot write off more than stock for ${p.title}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/write-offs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim() || null,
          notes: notes.trim() || null,
          items: cleaned,
        }),
      });

      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as { error?: unknown })?.error === "string"
            ? (data as { error: string }).error
            : "Failed";
        throw new Error(msg);
      }

      const id = (data as { id: string }).id;
      router.push(`/admin/write-offs/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Products */}
      <div className="border rounded p-3">
        <p className="font-semibold mb-2">Products</p>
        <ul className="space-y-1 max-h-[420px] overflow-y-auto">
          {products.map((p) => (
            <li key={p.id} className="flex justify-between">
              <button
                onClick={() => addProduct(p)}
                className="underline text-left"
                disabled={loading}
              >
                {p.title}
              </button>
              <span className="text-sm text-gray-600">
                value ৳ {p.price} | stk {p.stock}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Document */}
      <div className="border rounded p-3 space-y-3">
        <p className="font-semibold">Write-off</p>

        <input
          placeholder="Reason (e.g., damaged, scrap, missing)"
          className="w-full border px-2 py-1 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        />
        <textarea
          placeholder="Notes (optional)"
          className="w-full border px-2 py-1 text-sm min-h-[70px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
        />

        {/* Items */}
        {items.length === 0 ? (
          <p className="text-sm text-gray-600">Pick products from the left.</p>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center gap-2">
                <span className="flex-1 text-sm">{i.title}</span>
                <input
                  type="number"
                  min={1}
                  className="w-16 border px-1 text-sm"
                  value={i.quantity}
                  onChange={(e) => updateQty(i.productId, Number(e.target.value))}
                  disabled={loading}
                  title="Quantity"
                />
                <span className="w-[120px] text-right text-sm">
                  ৳ {i.unitValue * i.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i.productId)}
                  disabled={loading}
                  className="text-sm"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-2 font-bold">Total value: ৳ {totalValue}</div>

        {error && <p className="text-red-700 text-sm">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white py-2 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Create Write-off"}
        </button>
      </div>
    </div>
  );
}
