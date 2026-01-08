"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBdt } from "@/lib/money";

type Product = {
  id: string;
  title: string;
  stock: number;
  price: number;
};

type Party = {
  id: string;
  name: string;
  phone: string | null;
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
};

type SelectedItem = {
  productId: string;
  title: string;
  unitCost: number;
  quantity: number;
};

type PaymentKind = "CASH" | "BKASH" | "NAGAD" | "BANK" | "NONE";

export default function NewPurchaseUI({
  products,
  parties,
}: {
  products: Product[];
  parties: Party[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [partyId, setPartyId] = useState<string>("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");

  const [paymentKind, setPaymentKind] = useState<PaymentKind>("NONE");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partyOptions = useMemo(() => {
    // Purchases: suppliers are SUPPLIER or BOTH
    return parties.filter((p) => p.type === "SUPPLIER" || p.type === "BOTH");
  }, [parties]);

  function addProduct(p: Product) {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === p.id);
      if (found) {
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: p.id, title: p.title, unitCost: p.price, quantity: 1 }];
    });
  }

  function updateQty(productId: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  }

  function updateCost(productId: string, unitCost: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, unitCost } : i))
    );
  }

  function remove(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const paid = Math.max(0, Number.isFinite(amountPaid) ? amountPaid : 0);

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
          type: "SUPPLIER",
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
      setSupplierName(name);
      setSupplierPhone(newPartyPhone.trim());
      setShowQuickAdd(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function onSelectParty(id: string) {
    setPartyId(id);
    const p = partyOptions.find((x) => x.id === id);
    if (p) {
      setSupplierName(p.name);
      setSupplierPhone(p.phone ?? "");
    }
  }

  async function submit() {
    setError(null);
    if (items.length === 0) {
      setError("Add at least one product.");
      return;
    }

    const cleanedItems = items.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity),
      unitCost: Number(it.unitCost),
    }));

    for (const it of cleanedItems) {
      if (!it.productId) {
        setError("Invalid product.");
        return;
      }
      if (!Number.isFinite(it.quantity) || it.quantity < 1) {
        setError("Quantity must be at least 1.");
        return;
      }
      if (!Number.isFinite(it.unitCost) || it.unitCost < 0) {
        setError("Unit cost must be 0 or greater.");
        return;
      }
    }

    const name = supplierName.trim();
    if (!name && !partyId) {
      setError("Select a supplier contact or enter supplier name.");
      return;
    }

    if (paymentKind === "NONE") {
      setAmountPaid(0);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/purchase-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: partyId || null,
          supplierName: name || null,
          supplierPhone: supplierPhone.trim() || null,
          items: cleanedItems,
          paymentKind,
          amountPaid: paymentKind === "NONE" ? 0 : paid,
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
      router.push(`/admin/purchase-bills/${id}`);
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
              <button onClick={() => addProduct(p)} className="underline text-left">
                {p.title}
              </button>
              <span className="text-sm text-gray-600">
                cost {formatBdt(p.price)} | stk {p.stock}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bill */}
      <div className="border rounded p-3 space-y-3">
        <p className="font-semibold">Purchase Bill</p>

        {/* Supplier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Supplier / Contact</p>
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
            <option value="">— Select supplier contact (optional) —</option>
            {partyOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.phone ? ` (${p.phone})` : ""}
              </option>
            ))}
          </select>

          {showQuickAdd && (
            <div className="rounded border p-2 bg-gray-50 space-y-2">
              <input
                placeholder="Supplier name"
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
                {loading ? "Saving..." : "Create supplier"}
              </button>
            </div>
          )}

          <input
            placeholder="Supplier name (optional if selected above)"
            className="w-full border px-2 py-1 text-sm"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder="Supplier phone (optional)"
            className="w-full border px-2 py-1 text-sm"
            value={supplierPhone}
            onChange={(e) => setSupplierPhone(e.target.value)}
            disabled={loading}
          />
        </div>

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
                  min={0}
                  className="w-20 border px-1 text-sm"
                  value={i.unitCost}
                  onChange={(e) => updateCost(i.productId, Number(e.target.value))}
                  disabled={loading}
                  title="Unit cost"
                />
                <input
                  type="number"
                  min={1}
                  className="w-16 border px-1 text-sm"
                  value={i.quantity}
                  onChange={(e) => updateQty(i.productId, Number(e.target.value))}
                  disabled={loading}
                  title="Quantity"
                />
                <span className="w-[90px] text-right text-sm">{formatBdt(i.unitCost * i.quantity)}</span>
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

        <div className="border-t pt-2 font-bold">Total: {formatBdt(subtotal)}</div>

        {/* Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            className="w-full border px-2 py-1 text-sm bg-white"
            value={paymentKind}
            onChange={(e) => setPaymentKind(e.target.value as PaymentKind)}
            disabled={loading}
            title="Payment method (optional in MVP)"
          >
            <option value="NONE">No payment recorded</option>
            <option value="CASH">Cash</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="BANK">Bank</option>
          </select>

          <input
            type="number"
            min={0}
            className="w-full border px-2 py-1 text-sm"
            value={amountPaid}
            onChange={(e) => setAmountPaid(Number(e.target.value))}
            disabled={loading || paymentKind === "NONE"}
            placeholder="Amount paid"
          />
        </div>

        {error && <p className="text-red-700 text-sm">{error}</p>}

        <button onClick={submit} disabled={loading} className="w-full bg-black text-white py-2 disabled:opacity-60">
          {loading ? "Saving..." : "Save Purchase Bill"}
        </button>
      </div>
    </div>
  );
}
