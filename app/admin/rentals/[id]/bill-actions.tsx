"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type BillStatus = "DRAFT" | "ISSUED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PAID";

type LedgerAccountOption = {
  id: string;
  name: string;
  kind: string;
};

export default function BillActions({
  billId,
  status,
  paymentStatus,
  accounts,
}: {
  billId: string;
  status: BillStatus;
  paymentStatus: PaymentStatus;
  accounts: LedgerAccountOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "issue" | "cancel" | "paid">(null);
  const [error, setError] = useState<string | null>(null);

  const defaultAccountId = useMemo(() => {
    // Prefer CASH if present, else first account
    const cash = accounts.find((a) => a.kind === "CASH") ?? accounts.find((a) => a.name.toUpperCase().includes("CASH"));
    return (cash ?? accounts[0])?.id ?? "";
  }, [accounts]);

  const [accountId, setAccountId] = useState<string>(defaultAccountId);

  async function post(url: string, body?: any) {
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? "Request failed");
    return data;
  }

  async function issue() {
    setLoading("issue");
    try {
      await post(`/api/admin/rental-bills/${billId}/issue`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function cancel() {
    setLoading("cancel");
    try {
      await post(`/api/admin/rental-bills/${billId}/cancel`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function markPaid() {
    setLoading("paid");
    try {
      if (!accountId) {
        setError("Please select a ledger account.");
        setLoading(null);
        return;
      }

      await post(`/api/admin/rental-bills/${billId}/mark-paid`, { accountId });
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  }

  // Final states
  if (status === "CANCELLED") {
    return <span className="text-xs font-mono text-gray-600">CANCELLED</span>;
  }

  if (paymentStatus === "PAID") {
    return <span className="text-xs font-mono text-green-700">PAID</span>;
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      {status === "ISSUED" && (
        <div className="flex flex-col items-end gap-2 w-[220px]">
          <select
            className="w-full border rounded px-2 py-1 text-xs bg-white"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            disabled={loading !== null}
            title="Which account received the payment?"
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
            <p className="text-[11px] text-gray-600">
              Create at least one Ledger Account first (Admin → Ledger).
            </p>
          )}
        </div>
      )}

      <div className="inline-flex flex-wrap gap-2 justify-end">
        {status === "DRAFT" && (
          <button
            type="button"
            onClick={issue}
            disabled={loading !== null}
            className="rounded bg-black px-3 py-1 text-white text-xs disabled:opacity-60"
          >
            {loading === "issue" ? "Issuing..." : "Issue"}
          </button>
        )}

        {status === "ISSUED" && (
          <>
            <button
              type="button"
              onClick={markPaid}
              disabled={loading !== null || accounts.length === 0}
              className="rounded bg-black px-3 py-1 text-white text-xs disabled:opacity-60"
            >
              {loading === "paid" ? "Saving..." : "Mark paid"}
            </button>

            <button
              type="button"
              onClick={cancel}
              disabled={loading !== null}
              className="rounded border px-3 py-1 text-xs disabled:opacity-60"
              title="Cancel unpaid bill"
            >
              {loading === "cancel" ? "Cancelling..." : "Cancel"}
            </button>
          </>
        )}
      </div>

      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
