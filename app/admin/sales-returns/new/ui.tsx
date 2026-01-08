"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bdtFromPaisa, formatBdtFromPaisa } from "@/lib/money";

type InvoiceItem = {
  productId: string;
  titleSnapshot: string;
  unitPrice: number;
  quantity: number;
};

type Invoice = {
  id: string;
  invoiceNo: number;
  customerName: string;
  phone: string | null;
  total: number;
  partyId: string | null;
  items: InvoiceItem[];
};

type RefundMethod = "NONE" | "CASH" | "BKASH" | "NAGAD" | "BANK";

function fmt(no: number) {
  return `INV-${String(no).padStart(6, "0")}`;
}

export default function NewSalesReturnUI({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState<string>(invoices[0]?.id ?? "");
  const invoice = useMemo(() => invoices.find((x) => x.id === invoiceId) ?? null, [invoices, invoiceId]);

  const [qtyByProductId, setQtyByProductId] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("NONE");
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnLines = useMemo(() => {
    const it = invoice?.items ?? [];
    return it.map((i) => {
      const qty = Math.max(0, Math.floor(qtyByProductId[i.productId] ?? 0));
      const clamped = Math.min(qty, i.quantity);
      return {
        ...i,
        returnQty: clamped,
        lineTotal: clamped * i.unitPrice,
      };
    });
  }, [invoice, qtyByProductId]);

  const returnTotal = returnLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const returnTotalBdt = bdtFromPaisa(returnTotal);

  function onSelectInvoice(nextId: string) {
    setInvoiceId(nextId);
    setQtyByProductId({});
    setError(null);
    setRefundAmount(0);
  }

  async function submit() {
    setError(null);
    if (!invoice) {
      setError("Select an invoice.");
      return;
    }

    const items = returnLines
      .filter((x) => x.returnQty > 0)
      .map((x) => ({ productId: x.productId, quantity: x.returnQty }));

    if (items.length === 0) {
      setError("Select at least 1 item quantity to return.");
      return;
    }

    const safeRefund = Number.isFinite(refundAmount) ? Math.max(0, refundAmount) : 0;
    const desiredRefund =
      refundMethod === "NONE" ? 0 : Math.min(returnTotalBdt, safeRefund || returnTotalBdt);

    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesInvoiceId: invoice.id,
          items,
          notes: notes.trim() || null,
          refundMethod,
          refundAmount: desiredRefund,
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
      router.push(`/admin/sales-returns/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-3 space-y-2">
        <p className="font-semibold">Source invoice</p>
        <select
          className="w-full border rounded px-2 py-1 text-sm bg-white"
          value={invoiceId}
          onChange={(e) => onSelectInvoice(e.target.value)}
          disabled={loading}
        >
          {invoices.length === 0 ? <option value="">No issued invoices found</option> : null}
          {invoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {fmt(inv.invoiceNo)} - {inv.customerName} - {formatBdtFromPaisa(inv.total)}
            </option>
          ))}
        </select>
        {invoice ? (
          <div className="text-sm text-gray-700">
            {invoice.customerName}
            {invoice.phone ? <span className="text-gray-500"> • {invoice.phone}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="rounded border p-3 space-y-2">
        <p className="font-semibold">Return items</p>

        {!invoice ? (
          <p className="text-sm text-gray-600">Select an invoice to load items.</p>
        ) : (
          <div className="space-y-2">
            {returnLines.map((l) => (
              <div key={l.productId} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-sm">{l.titleSnapshot}</div>
                  <div className="text-xs text-gray-500">
                    Sold: {l.quantity} • Unit: {formatBdtFromPaisa(l.unitPrice)}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={l.quantity}
                  className="w-20 border px-2 py-1 text-sm"
                  value={qtyByProductId[l.productId] ?? 0}
                  onChange={(e) =>
                    setQtyByProductId((prev) => ({ ...prev, [l.productId]: Number(e.target.value) }))
                  }
                  disabled={loading}
                  title="Return quantity"
                />
                <div className="w-[110px] text-right text-sm font-mono">
                  {formatBdtFromPaisa(l.lineTotal)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-2 font-bold">
          Return total: {formatBdtFromPaisa(returnTotal)}
        </div>
      </div>

      <div className="rounded border p-3 space-y-2">
        <p className="font-semibold">Refund (optional)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            className="w-full border rounded px-2 py-1 text-sm bg-white"
            value={refundMethod}
            onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
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
            className="w-full border px-2 py-1 text-sm"
            value={refundAmount}
            onChange={(e) => setRefundAmount(Number(e.target.value))}
            disabled={loading || refundMethod === "NONE"}
            placeholder={`Refund amount (default ${formatBdtFromPaisa(returnTotal)})`}
          />
        </div>
        <textarea
          className="w-full border rounded px-2 py-1 text-sm"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          placeholder="Notes (optional)"
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        {loading ? "Saving..." : "Create Sales Return"}
      </button>
    </div>
  );
}
