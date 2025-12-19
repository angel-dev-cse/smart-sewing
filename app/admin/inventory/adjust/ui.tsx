"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  stock: number;
};

type Mode = "DELTA" | "SET";

export default function AdjustStockForm({ products }: { products: Product[] }) {
  const router = useRouter();

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>("DELTA");
  const [value, setValue] = useState<number>(0);
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const selected = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!productId) return setErr("Select a product.");
    if (!Number.isInteger(value)) return setErr("Value must be an integer.");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          mode,
          value,
          reason: reason.trim() ? reason.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error ?? "Failed to adjust stock.");
        setLoading(false);
        return;
      }

      setMsg("Stock adjusted successfully.");
      setReason("");
      setValue(0);

      // Refresh server components (stock shown on other pages)
      router.refresh();
    } catch {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded border bg-white p-4 space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1">Product</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} (stock: {p.stock})
            </option>
          ))}
        </select>
        {selected && (
          <p className="text-xs text-gray-600 mt-1">
            Selected: <span className="font-mono">{selected.id}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Mode</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="DELTA">Delta (± change)</option>
            <option value="SET">Set exact stock</option>
          </select>
          <p className="text-xs text-gray-600 mt-1">
            {mode === "DELTA"
              ? "Example: +5 or -2"
              : "Example: set stock to 10"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Value</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Reason (optional)</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Stock count correction"
        />
      </div>

      {err && (
        <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">
          {err}
        </div>
      )}
      {msg && (
        <div className="border border-green-300 bg-green-50 text-green-800 p-3 rounded text-sm">
          {msg}
        </div>
      )}

      <button
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        type="submit"
      >
        {loading ? "Adjusting..." : "Adjust stock"}
      </button>
    </form>
  );
}
