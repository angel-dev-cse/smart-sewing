"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bdtFromPaisa, formatBdtFromPaisa } from "@/lib/money";

type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

type AccountOption = {
  id: string;
  name: string;
  kind: string;
};

export default function InvoicePaymentActions({
  invoiceId,
  total,
  paid,
  paymentStatus,
  accounts,
}: {
  invoiceId: string;
  total: number;
  paid: number;
  paymentStatus: PaymentStatus;
  accounts: AccountOption[];
}) {
  const router = useRouter();
  const remaining = Math.max(0, total - paid);

  const defaultAccountId = useMemo(() => {
    const cash = accounts.find((a) => a.kind === "CASH") ?? accounts.find((a) => a.name.toUpperCase().includes("CASH"));
    return (cash ?? accounts[0])?.id ?? "";
  }, [accounts]);

  const [accountId, setAccountId] = useState<string>(defaultAccountId);
  const [amount, setAmount] = useState<string>(
    remaining ? String(bdtFromPaisa(remaining)) : ""
  );
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (!accountId) throw new Error("Please select a ledger account.");

      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a valid amount.");

      const res = await fetch(`/api/admin/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, amount: n, note: note.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Request failed");

      setAmount("");
      setNote("");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Status:</span>
          <span className="font-mono">{paymentStatus}</span>
          <span className="text-gray-400">•</span>
          <span>
            Paid: <span className="font-semibold">{formatBdtFromPaisa(paid)}</span>
          </span>
          <span className="text-gray-400">•</span>
          <span>
            Remaining: <span className="font-semibold">{formatBdtFromPaisa(remaining)}</span>
          </span>
        </div>
      </div>

      {remaining === 0 ? (
        <p className="text-xs text-gray-600">This invoice is fully paid.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ledger account</label>
            <select
              className="w-full border rounded px-2 py-2 text-sm bg-white"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={loading}
            >
              {accounts.length === 0 ? (
                <option value="">No ledger accounts</option>
              ) : (
                accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.kind})
                  </option>
                ))
              )}
            </select>
            {accounts.length === 0 && (
              <p className="text-[11px] text-gray-600 mt-1">Create a Ledger Account first (Admin → Ledger).</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Amount</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remaining ? String(bdtFromPaisa(remaining)) : "0"}
              inputMode="numeric"
              disabled={loading || accounts.length === 0}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={loading || accounts.length === 0}
              className="rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-60"
            >
              {loading ? "Saving..." : "Add payment"}
            </button>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs text-gray-600 mb-1">Note (optional)</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='e.g., "Advance", "Paid from bKash", "2nd payment"'
              disabled={loading || accounts.length === 0}
            />
          </div>
        </div>
      )}

      {error && <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}
    </div>
  );
}
