"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";

export default function RentalActions({
  contractId,
  status,
  showBillGenerator,
}: {
  contractId: string;
  status: Status;
  showBillGenerator?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "activate" | "close" | "bill">(null);
  const [error, setError] = useState<string | null>(null);

  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");

  async function post(url: string, body?: Record<string, unknown>) {
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? "Request failed");
    return data;
  }

  async function activate() {
    setLoading("activate");
    try {
      await post(`/api/admin/rentals/${contractId}/activate`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function close() {
    setLoading("close");
    try {
      await post(`/api/admin/rentals/${contractId}/close`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function generateBill() {
    setLoading("bill");
    try {
      if (!periodStart || !periodEnd) {
        setError("Please enter periodStart and periodEnd.");
        setLoading(null);
        return;
      }

      // const data = await post(`/api/admin/rentals/${contractId}/bills`, {
      //   periodStart,
      //   periodEnd,
      // });

      // For now we just refresh the contract page list
      router.refresh();

      // Optional: clear fields after success
      setPeriodStart("");
      setPeriodEnd("");

      // data.id exists (bill id) if you want later to navigate
      // router.push(`/admin/rentals/${contractId}`) is current page anyway
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  if (showBillGenerator) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Period start</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 text-sm"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              disabled={status !== "ACTIVE" || loading === "bill"}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Period end</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 text-sm"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              disabled={status !== "ACTIVE" || loading === "bill"}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={generateBill}
              disabled={status !== "ACTIVE" || loading === "bill"}
              className="rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-60 w-full"
            >
              {loading === "bill" ? "Generating..." : "Generate bill"}
            </button>
          </div>
        </div>

        {status !== "ACTIVE" && (
          <p className="text-xs text-gray-600">
            Bills can be generated only when the contract is <span className="font-mono">ACTIVE</span>.
          </p>
        )}

        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        onClick={activate}
        disabled={status !== "DRAFT" || loading !== null}
        className="rounded bg-black px-3 py-1 text-white text-sm disabled:opacity-60"
      >
        {loading === "activate" ? "Activating..." : "Activate"}
      </button>

      <button
        type="button"
        onClick={close}
        disabled={status !== "ACTIVE" || loading !== null}
        className="rounded border px-3 py-1 text-sm disabled:opacity-60"
      >
        {loading === "close" ? "Closing..." : "Close / Return"}
      </button>

      {error && (
        <span className="text-sm text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}
