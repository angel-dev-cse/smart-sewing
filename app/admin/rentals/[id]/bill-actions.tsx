"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  billId: string;
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
};

export default function BillActions({ billId, status, paymentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "issue" | "cancel" | "paid">(null);

  async function call(path: string, key: "issue" | "cancel" | "paid") {
    setLoading(key);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Update failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {status === "DRAFT" && (
        <button
          disabled={loading !== null}
          onClick={() => call(`/api/admin/rental-bills/${billId}/issue`, "issue")}
          className="rounded bg-black px-3 py-1 text-white text-xs disabled:opacity-60"
        >
          {loading === "issue" ? "Issuing..." : "Issue"}
        </button>
      )}

      {status !== "CANCELLED" && (
        <button
          disabled={loading !== null}
          onClick={() => call(`/api/admin/rental-bills/${billId}/cancel`, "cancel")}
          className="rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "cancel" ? "Cancelling..." : "Cancel"}
        </button>
      )}

      {status === "ISSUED" && paymentStatus !== "PAID" && (
        <button
          disabled={loading !== null}
          onClick={() => call(`/api/admin/rental-bills/${billId}/mark-paid`, "paid")}
          className="rounded border px-3 py-1 text-xs disabled:opacity-60"
        >
          {loading === "paid" ? "Updating..." : "Mark paid"}
        </button>
      )}
    </div>
  );
}
