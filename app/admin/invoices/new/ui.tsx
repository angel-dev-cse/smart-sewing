"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProductPick = {
  id: string;
  title: string;
  price: number;
  stock: number;
  type: string;
};

type Row = {
  productId: string;
  quantity: number;
  unitPriceOverride: number | null;
};

export default function NewInvoiceForm({ products }: { products: ProductPick[] }) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("Chittagong");
  const [notes, setNotes] = useState("");

  const [discount, setDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  const [rows, setRows] = useState<Row[]>([
    { productId: "", quantity: 1, unitPriceOverride: null },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const computed = useMemo(() => {
    let subtotal = 0;

    for (const r of rows) {
      if (!r.productId) continue;
      const p = productMap.get(r.productId);
      if (!p) continue;

      const q = Number.isFinite(r.quantity) ? r.quantity : 0;
      if (q <= 0) continue;

      const unit = r.unitPriceOverride != null ? r.unitPriceOverride : p.price;
      subtotal += unit * q;
    }

    const safeDiscount = Math.max(0, Math.floor(discount || 0));
    const safeDelivery = Math.max(0, Math.floor(deliveryFee || 0));
    const total = Math.max(0, subtotal - safeDiscount + safeDelivery);

    return { subtotal, safeDiscount, safeDelivery, total };
  }, [rows, productMap, discount, deliveryFee]);

  function addRow() {
    setRows((prev) => [...prev, { productId: "", quantity: 1, unitPriceOverride: null }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = customerName.trim();
    if (!name) return setError("Customer name is required.");

    const cleanRows = rows
      .filter((r) => r.productId && Number.isInteger(r.quantity) && r.quantity > 0)
      .map((r) => ({
        productId: r.productId,
        quantity: Math.floor(r.quantity),
        ...(r.unitPriceOverride != null && Number.isInteger(r.unitPriceOverride) && r.unitPriceOverride >= 0
          ? { unitPriceOverride: Math.floor(r.unitPriceOverride) }
          : {}),
      }));

    if (cleanRows.length === 0) return setError("Add at least one item.");

    // Optional: warn if quantity exceeds current stock (draft can still be created)
    for (const r of cleanRows) {
      const p = productMap.get(r.productId);
      if (p && r.quantity > p.stock) {
        // We don't hard-block DRAFT creation because stock can be adjusted before issuing,
        // but you can change this to return an error if you prefer strict behavior.
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone: phone.trim() || null,
          addressLine1: addressLine1.trim() || null,
          city: city.trim() || null,
          notes: notes.trim() || null,
          discount: Math.floor(discount || 0),
          deliveryFee: Math.floor(deliveryFee || 0),
          items: cleanRows,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Failed to create invoice.");
        return;
      }

      router.push(`/admin/invoices/${json.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Customer */}
      <div className="rounded border bg-white p-4 space-y-3">
        <p className="font-semibold">Customer</p>

        <div>
          <label className="block text-sm font-medium mb-1">Customer name *</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes for this invoice"
          />
        </div>
      </div>

      {/* Items */}
      <div className="rounded border bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Items</p>
          <button
            type="button"
            onClick={addRow}
            className="text-sm underline"
          >
            + Add item
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((r, idx) => {
            const p = r.productId ? productMap.get(r.productId) : null;
            const unit = r.unitPriceOverride != null ? r.unitPriceOverride : p?.price ?? 0;
            const lineTotal = (Number.isFinite(r.quantity) ? r.quantity : 0) * unit;

            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded p-3">
                <div className="md:col-span-6">
                  <label className="block text-xs font-medium mb-1">Product</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={r.productId}
                    onChange={(e) => updateRow(idx, { productId: e.target.value })}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (৳ {p.price.toLocaleString()}, stock {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={r.quantity}
                    onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium mb-1">Unit price (optional)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={r.unitPriceOverride ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateRow(idx, { unitPriceOverride: v === "" ? null : Number(v) });
                    }}
                    placeholder={p ? String(p.price) : "price"}
                  />
                  {p && (
                    <p className="text-[11px] text-gray-600 mt-1">
                      Default: ৳ {p.price.toLocaleString()} • Stock: {p.stock}
                    </p>
                  )}
                </div>

                <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-2">
                  <div className="text-sm font-semibold md:hidden">
                    ৳ {lineTotal.toLocaleString()}
                  </div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="text-sm underline text-red-600"
                      onClick={() => removeRow(idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="md:col-span-12 text-right text-sm font-semibold hidden md:block">
                  Line total: ৳ {lineTotal.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="rounded border bg-white p-4 space-y-3">
        <p className="font-semibold">Totals</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Discount</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-3 py-2"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Delivery fee</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-3 py-2"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="border-t pt-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>৳ {computed.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>- ৳ {computed.safeDiscount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery fee</span>
            <span>+ ৳ {computed.safeDelivery.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2 mt-2">
            <span>Total</span>
            <span>৳ {computed.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      <button
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create draft invoice"}
      </button>
    </form>
  );
}
