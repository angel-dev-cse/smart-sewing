"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderInvoiceActions({
  orderId,
  status,
  salesInvoiceId,
}: {
  orderId: string;
  status: string;
  salesInvoiceId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/generate-invoice`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error ?? "Failed to generate invoice");
        return;
      }

      router.refresh();
      if (json.invoiceId) {
        router.push(`/admin/invoices/${json.invoiceId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (salesInvoiceId) {
    return (
      <div className="flex gap-3">
        <a className="underline text-sm" href={`/admin/invoices/${salesInvoiceId}`}>
          Open invoice
        </a>
        <a
          className="underline text-sm"
          href={`/admin/invoices/${salesInvoiceId}/print`}
          target="_blank"
          rel="noreferrer"
        >
          Print invoice
        </a>
      </div>
    );
  }

  if (status !== "CONFIRMED") {
    return (
      <p className="text-sm text-gray-600">
        Invoice can be generated once the order is <b>CONFIRMED</b>.
      </p>
    );
  }

  return (
    <button
      disabled={loading}
      onClick={generate}
      className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60"
    >
      {loading ? "Generating..." : "Generate invoice"}
    </button>
  );
}
