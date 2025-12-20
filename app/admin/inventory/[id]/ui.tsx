"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InventoryAdjustForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [action, setAction] = useState<"IN" | "OUT" | "SET">("IN");
  const [quantity, setQuantity] = useState<number>(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action, quantity, note }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error ?? "Update failed");
        return;
      }

      setNote("");
      setQuantity(0);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={action}
          onChange={(e) => setAction(e.target.value as "IN" | "OUT" | "SET")}
        >
          <option value="IN">Add stock (IN)</option>
          <option value="OUT">Remove stock (OUT)</option>
          <option value="SET">Set stock (COUNT)</option>
        </select>

        <input
          type="number"
          className="border rounded px-3 py-2 text-sm w-40"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min={0}
        />

        <input
          className="border rounded px-3 py-2 text-sm flex-1"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (supplier, invoice, reason...)"
        />
      </div>

      <button
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-60 w-fit"
      >
        {loading ? "Saving..." : "Save movement"}
      </button>
    </form>
  );
}
