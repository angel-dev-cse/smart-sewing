"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BillStatus = "DRAFT" | "ISSUED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PAID";

export default function BillActions({
  billId,
  status,
  paymentStatus,
}: {
  billId: string;
  status: BillStatus;
  paymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "issue" | "cancel" | "paid">(null);
  const [error, setError] = useState<string | null>(null);

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
      // Your backend currently supports marking paid without an accountId.
      // If you later want to require an accountId, add a dropdown here and send it.
      await post(`/api/admin/rental-bills/${billId}/mark-paid`);
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
              disabled={loading !== null}
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
