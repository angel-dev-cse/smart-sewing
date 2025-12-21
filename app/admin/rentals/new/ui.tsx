"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type P = { id: string; title: string; stock: number };
type Party = { id: string; name: string; phone: string | null; type: "CUSTOMER" | "SUPPLIER" | "BOTH" };

export default function NewRentalForm({ products, parties }: { products: P[]; parties: Party[] }) {
  const router = useRouter();

  const customerOptions = useMemo(() => {
    // Rentals: customers are CUSTOMER or BOTH
    return parties.filter((p) => p.type === "CUSTOMER" || p.type === "BOTH");
  }, [parties]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [partyId, setPartyId] = useState<string>("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("Chittagong");
  const [deposit, setDeposit] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const [rows, setRows] = useState<Array<{ productId: string; quantity: number; monthlyRate: number }>>([
    { productId: products[0]?.id ?? "", quantity: 1, monthlyRate: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function onSelectParty(id: string) {
    setPartyId(id);
    const p = customerOptions.find((x) => x.id === id);
    if (p) {
      setCustomerName(p.name);
      setPhone(p.phone ?? "");
    }
  }

  function updateRow(i: number, patch: Partial<(typeof rows)[number]>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { productId: products[0]?.id ?? "", quantity: 1, monthlyRate: 0 }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) return setError("Customer name required.");
    if (!Number.isInteger(deposit) || deposit < 0) return setError("Deposit must be a non-negative integer.");

    const items = rows
      .map((r) => ({
        productId: r.productId,
        quantity: Number(r.quantity),
        monthlyRate: Number(r.monthlyRate),
      }))
      .filter((r) => r.productId);

    if (items.length === 0) return setError("Add at least one rentable item.");

    for (const it of items) {
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) return setError("Quantity must be positive integer.");
      if (!Number.isInteger(it.monthlyRate) || it.monthlyRate <= 0) return setError("Monthly rate must be positive integer.");
      const p = productMap.get(it.productId);
      if (!p) return setError("Invalid product.");
      // note: activation checks stock again; here is just a hint
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: partyId || null,
          customerName: customerName.trim(),
          phone: phone.trim() || null,
          addressLine1: addressLine1.trim() || null,
          city: city.trim() || null,
          deposit,
          notes: notes.trim() || null,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed.");
        setLoading(false);
        return;
      }

      router.push(`/admin/rentals/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">New rental contract</h1>
          <p className="text-sm text-gray-600">Draft → Activate when machine is handed over.</p>
        </div>
        <button className="text-sm underline" type="button" onClick={() => router.push("/admin/rentals")}>
          Back
        </button>
      </div>

      <form onSubmit={submit} className="rounded border bg-white p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer / Contact (optional)</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={partyId}
            onChange={(e) => onSelectParty(e.target.value)}
            disabled={loading}
          >
            <option value="">— Select customer contact (optional) —</option>
            {customerOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.phone ? ` (${p.phone})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600 mt-1">
            Selecting a contact will auto-fill name and phone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Customer name</label>
            <input className="w-full border rounded px-3 py-2" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input className="w-full border rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea className="w-full border rounded px-3 py-2" rows={2} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input className="w-full border rounded px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deposit (BDT)</label>
            <input className="w-full border rounded px-3 py-2" inputMode="numeric" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input className="w-full border rounded px-3 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold">Rent items</p>
            <button type="button" className="text-sm underline" onClick={addRow}>
              + Add item
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Machine</label>
                  <select className="w-full border rounded px-3 py-2" value={r.productId} onChange={(e) => updateRow(i, { productId: e.target.value })}>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (stock {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Qty</label>
                  <input className="w-full border rounded px-3 py-2" inputMode="numeric" value={r.quantity} onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })} />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Monthly rate</label>
                  <input className="w-full border rounded px-3 py-2" inputMode="numeric" value={r.monthlyRate} onChange={(e) => updateRow(i, { monthlyRate: Number(e.target.value) })} />
                </div>

                {rows.length > 1 && (
                  <div className="md:col-span-4">
                    <button type="button" className="text-xs underline text-gray-700" onClick={() => removeRow(i)}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

        <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-60" disabled={loading}>
          {loading ? "Saving..." : "Create draft contract"}
        </button>
      </form>
    </div>
  );
}
