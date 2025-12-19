"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InvoiceActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function call(path: string) {
    setLoading(true);
    try {
      const res = await fetch(path, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error ?? "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {status === "DRAFT" && (
        <button
          disabled={loading}
          onClick={() => call(`/api/admin/invoices/${invoiceId}/issue`)}
          className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60"
        >
          {loading ? "Working..." : "Issue"}
        </button>
      )}

      {status !== "CANCELLED" && (
        <button
          disabled={loading}
          onClick={() => call(`/api/admin/invoices/${invoiceId}/cancel`)}
          className="rounded border px-3 py-2 text-sm disabled:opacity-60"
        >
          {loading ? "Working..." : "Cancel"}
        </button>
      )}
    </div>
  );
}
