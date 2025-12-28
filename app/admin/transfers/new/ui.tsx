"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type LocationOpt = { id: string; code: string; name: string };
type ProductOpt = { id: string; title: string };

type Line = { productId: string; quantity: string };

export default function NewTransferForm({
  locations,
  products,
  defaultFromLocationId,
  defaultToLocationId,
}: {
  locations: LocationOpt[];
  products: ProductOpt[];
  defaultFromLocationId: string;
  defaultToLocationId: string;
}) {
  const router = useRouter();

  const locLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of locations) map.set(l.id, `${l.name} (${l.code})`);
    return map;
  }, [locations]);

  const [fromLocationId, setFromLocationId] = useState<string>(defaultFromLocationId);
  const [toLocationId, setToLocationId] = useState<string>(defaultToLocationId);
  const [notes, setNotes] = useState<string>("");

  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "1" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: "1" }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (!fromLocationId || !toLocationId) throw new Error("Please select both locations.");
      if (fromLocationId === toLocationId) throw new Error("From and To locations must be different.");

      const items = lines
        .map((l) => ({
          productId: l.productId,
          quantity: Math.floor(Number(l.quantity)),
        }))
        .filter((l) => l.productId && Number.isFinite(l.quantity) && l.quantity > 0);

      if (items.length === 0) throw new Error("Add at least one item.");

      const res = await fetch("/api/admin/stock-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLocationId,
          toLocationId,
          notes: notes.trim() || null,
          items,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed");

      router.push("/admin/transfers");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">From location</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm bg-white"
            value={fromLocationId}
            onChange={(e) => setFromLocationId(e.target.value)}
            disabled={loading}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">To location</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm bg-white"
            value={toLocationId}
            onChange={(e) => setToLocationId(e.target.value)}
            disabled={loading}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Notes (optional)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="e.g. Move stock to shop"
          />
        </div>
      </div>

      <div className="rounded border">
        <div className="bg-gray-50 px-3 py-2 text-sm font-semibold">Items</div>
        <div className="p-3 space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-8">
                <label className="block text-xs text-gray-600 mb-1">Product</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                  value={l.productId}
                  onChange={(e) => setLine(i, { productId: e.target.value })}
                  disabled={loading}
                >
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={loading || lines.length === 1}
                  className="rounded border px-3 py-2 text-sm disabled:opacity-60 w-full"
                  title={lines.length === 1 ? "Keep at least one line" : "Remove"}
                >
                  Remove
                </button>
              </div>

              {l.productId && (
                <div className="md:col-span-12 text-xs text-gray-600">
                  From: {locLabel.get(fromLocationId) ?? "—"} → To: {locLabel.get(toLocationId) ?? "—"}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={addLine}
              disabled={loading}
              className="rounded border px-3 py-2 text-sm disabled:opacity-60"
            >
              + Add item
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-60"
            >
              {loading ? "Saving..." : "Create transfer"}
            </button>
          </div>

          {error && <div className="text-sm text-red-700">{error}</div>}
        </div>
      </div>
    </div>
  );
}
