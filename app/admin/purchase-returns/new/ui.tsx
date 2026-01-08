"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bdtFromPaisa, formatBdtFromPaisa } from "@/lib/money";

type BillItem = {
  productId: string;
  titleSnapshot: string;
  unitCost: number;
  quantity: number;
};

type Bill = {
  id: string;
  billNo: number;
  supplierName: string;
  phone: string | null;
  total: number;
  partyId: string | null;
  items: BillItem[];
};

type RefundMethod = "NONE" | "CASH" | "BKASH" | "NAGAD" | "BANK";

export default function NewPurchaseReturnUI({ bills }: { bills: Bill[] }) {
  const router = useRouter();
  const [billId, setBillId] = useState<string>(bills[0]?.id ?? "");
  const [qtyByProductId, setQtyByProductId] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("NONE");
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bill = useMemo(() => bills.find((b) => b.id === billId) ?? null, [bills, billId]);

  const total = useMemo(() => {
    if (!bill) return 0;
    return bill.items.reduce((sum, it) => {
      const q = Math.max(0, Math.floor(qtyByProductId[it.productId] ?? 0));
      return sum + it.unitCost * q;
    }, 0);
  }, [bill, qtyByProductId]);
  const totalBdt = bdtFromPaisa(total);

  function setQty(productId: string, next: number, max: number) {
    const v = Math.max(0, Math.min(max, Math.floor(next)));
    setQtyByProductId((prev) => ({ ...prev, [productId]: v }));
  }

  async function submit() {
    setError(null);
    if (!bill) {
      setError("Select a purchase bill.");
      return;
    }

    const items = bill.items
      .map((it) => ({ productId: it.productId, quantity: Math.max(0, Math.floor(qtyByProductId[it.productId] ?? 0)) }))
      .filter((it) => it.quantity > 0);

    if (items.length === 0) {
      setError("Pick at least one item and quantity to return.");
      return;
    }

    const method = refundMethod;
    const rawAmount = Number.isFinite(refundAmount) ? Math.max(0, refundAmount) : 0;
    const amount = method === "NONE" ? 0 : Math.min(totalBdt, rawAmount || totalBdt);

    setLoading(true);
    try {
      const res = await fetch("/api/admin/purchase-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseBillId: bill.id,
          items,
          refundMethod: method,
          refundAmount: amount,
          notes: notes.trim() || null,
        }),
      });

      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as { error?: unknown })?.error === "string"
            ? (data as { error: string }).error
            : "Failed to create purchase return.";
        throw new Error(msg);
      }

      const id = (data as { id: string }).id;
      router.push(`/admin/purchase-returns/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-3 bg-white space-y-2">
        <p className="font-semibold">Source purchase bill</p>
        <select
          className="w-full border rounded px-2 py-1 text-sm bg-white"
          value={billId}
          onChange={(e) => {
            setBillId(e.target.value);
            setQtyByProductId({});
            setRefundAmount(0);
          }}
          disabled={loading}
        >
          {bills.map((b) => (
            <option key={b.id} value={b.id}>
              PB-{String(b.billNo).padStart(6, "0")} — {b.supplierName} ({formatBdtFromPaisa(b.total)})
            </option>
          ))}
        </select>

        {bill ? (
          <p className="text-sm text-gray-600">
            Supplier: <span className="font-medium">{bill.supplierName}</span>
            {bill.phone ? ` • ${bill.phone}` : ""}
          </p>
        ) : null}
      </div>

      <div className="rounded border p-3 bg-white">
        <p className="font-semibold mb-2">Return items</p>
        {!bill ? (
          <p className="text-sm text-gray-600">Select a purchase bill first.</p>
        ) : (
          <div className="space-y-2">
            {bill.items.map((it) => {
              const q = Math.max(0, Math.floor(qtyByProductId[it.productId] ?? 0));
              return (
                <div key={it.productId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{it.titleSnapshot}</div>
                    <div className="text-xs text-gray-600">
                      Purchased: {it.quantity} • Unit cost: {formatBdtFromPaisa(it.unitCost)}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={it.quantity}
                    value={q}
                    onChange={(e) => setQty(it.productId, Number(e.target.value), it.quantity)}
                    disabled={loading}
                    className="w-20 border rounded px-2 py-1 text-sm"
                    title="Return quantity"
                  />
                  <div className="w-[120px] text-right text-sm font-semibold whitespace-nowrap">
                    {formatBdtFromPaisa(it.unitCost * q)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t mt-3 pt-3 flex items-center justify-between">
          <span className="font-semibold">Return total</span>
          <span className="font-bold">{formatBdtFromPaisa(total)}</span>
        </div>
      </div>

      <div className="rounded border p-3 bg-white space-y-2">
        <p className="font-semibold">Refund from supplier (optional)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            className="w-full border rounded px-2 py-1 text-sm bg-white"
            value={refundMethod}
            onChange={(e) => {
              const v = e.target.value as RefundMethod;
              setRefundMethod(v);
              if (v === "NONE") setRefundAmount(0);
            }}
            disabled={loading}
          >
            <option value="NONE">No refund recorded</option>
            <option value="CASH">Cash</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="BANK">Bank</option>
          </select>

          <input
            type="number"
            min={0}
            value={refundAmount}
            onChange={(e) => setRefundAmount(Number(e.target.value))}
            disabled={loading || refundMethod === "NONE"}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Refund amount"
          />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Notes (optional)"
          rows={3}
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        onClick={submit}
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-60"
      >
        {loading ? "Saving..." : "Create Purchase Return"}
      </button>
    </div>
  );
}
