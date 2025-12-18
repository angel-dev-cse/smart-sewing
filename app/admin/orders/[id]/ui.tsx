"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID";
};

export default function AdminOrderActions({
  orderId,
  status,
  paymentStatus,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(data: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
  
      const json = await res.json().catch(() => ({}));
  
      if (!res.ok) {
        alert(json?.error ?? "Update failed");
        return;
      }
  
      router.refresh();
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          disabled={loading || status === "CONFIRMED"}
          onClick={() => patch({ status: "CONFIRMED" })}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-60"
        >
          Confirm
        </button>

        <button
          disabled={loading || status === "CANCELLED"}
          onClick={() => patch({ status: "CANCELLED" })}
          className="rounded border px-3 py-2 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>

      <div className="flex gap-2">
        <button
          disabled={loading || paymentStatus === "PAID"}
          onClick={() => patch({ paymentStatus: "PAID" })}
          className="rounded bg-green-700 px-3 py-2 text-white disabled:opacity-60"
        >
          Mark Paid
        </button>

        <button
          disabled={loading || paymentStatus === "UNPAID"}
          onClick={() => patch({ paymentStatus: "UNPAID" })}
          className="rounded border px-3 py-2 disabled:opacity-60"
        >
          Mark Unpaid
        </button>
      </div>
    </div>
  );
}
