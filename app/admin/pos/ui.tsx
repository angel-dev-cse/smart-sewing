"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  price: number;
  stock: number;
};

type Item = Product & { qty: number };

type Party = {
  id: string;
  name: string;
  phone: string | null;
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
};

type PosPay = "CASH" | "BKASH" | "NAGAD" | "BANK_TRANSFER";

export default function PosClient({
  products,
  parties,
}: {
  products: Product[];
  parties: Party[];
}) {
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [partyId, setPartyId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PosPay>("CASH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerOptions = useMemo(() => {
    return parties.filter((p) => p.type === "CUSTOMER" || p.type === "BOTH");
  }, [parties]);

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

  function onSelectParty(id: string) {
    setPartyId(id);
    const p = customerOptions.find((x) => x.id === id);
    if (p) {
      setCustomerName(p.name);
      setPhone(p.phone ?? "");
    }
  }

  async function quickAddParty() {
    setError(null);
    const name = newPartyName.trim();
    if (!name) {
      setError("Contact name is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CUSTOMER",
          name,
          phone: newPartyPhone.trim() || null,
        }),
      });

      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as { error?: unknown })?.error === "string"
            ? (data as { error: string }).error
            : "Failed to create contact.";
        throw new Error(msg);
      }

      const id = (data as { id: string }).id;
      setPartyId(id);
      setCustomerName(name);
      setPhone(newPartyPhone.trim());
      setShowQuickAdd(false);

      // Refresh server props (so the new party appears in select if user opens it again)
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setError(null);
    if (items.length === 0) {
      setError("Add at least one product.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: partyId || null,
          customerName: customerName || "Walk-in customer",
          phone: phone || null,
          paymentMethod,
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.qty,
          })),
        }),
      });

      const data: { invoiceId?: string; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      router.push(`/admin/invoices/${data.invoiceId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
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

        {/* Customer / Contact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Customer / Contact</p>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => setShowQuickAdd((v) => !v)}
              disabled={loading}
            >
              {showQuickAdd ? "Hide" : "Quick add"}
            </button>
          </div>

          <select
            className="w-full border rounded px-2 py-1 text-sm bg-white"
            value={partyId}
            onChange={(e) => onSelectParty(e.target.value)}
            disabled={loading}
          >
            <option value="">— Walk-in / no contact —</option>
            {customerOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.phone ? ` (${p.phone})` : ""}
              </option>
            ))}
          </select>

          {showQuickAdd && (
            <div className="rounded border p-2 bg-gray-50 space-y-2">
              <input
                placeholder="Customer name"
                className="w-full border px-2 py-1 text-sm"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                disabled={loading}
              />
              <input
                placeholder="Phone (optional)"
                className="w-full border px-2 py-1 text-sm"
                value={newPartyPhone}
                onChange={(e) => setNewPartyPhone(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={quickAddParty}
                disabled={loading}
                className="rounded bg-black px-3 py-1 text-white text-sm disabled:opacity-60"
              >
                {loading ? "Saving..." : "Create customer"}
              </button>
            </div>
          )}
        </div>

        {/* Items */}
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
