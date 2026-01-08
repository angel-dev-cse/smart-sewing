"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PurchaseBillItem = {
  id: string;
  quantity: number;
  titleSnapshot: string;
  productId: string;
  product: {
    id: string;
    title: string;
    type: "MACHINE_SALE" | "MACHINE_RENT" | "PART";
    isAssetTracked: boolean;
    serialRequired: boolean;
    brand: string | null;
    model: string | null;
  } | null;
};

type Location = { id: string; code: string; name: string };

type IntakeRow = {
  productId: string;
  brand: string;
  model: string;
  manufacturerSerial: string;
  tagCode: string;
};

export default function IssuePanel({
  billId,
  status,
  items,
  locations,
  defaultLocationId,
}: {
  billId: string;
  status: string;
  items: PurchaseBillItem[];
  locations: Location[];
  defaultLocationId: string;
}) {
  const router = useRouter();

  const trackedItems = useMemo(
    () => items.filter((i) => i.product?.isAssetTracked),
    [items]
  );

  const [receivingLocationId, setReceivingLocationId] = useState(defaultLocationId);
  const [rows, setRows] = useState<IntakeRow[]>(() => {
    const defaults: IntakeRow[] = [];
    for (const it of trackedItems) {
      const baseBrand = it.product?.brand ?? "";
      const baseModel = it.product?.model ?? "";
      for (let i = 0; i < it.quantity; i++) {
        defaults.push({
          productId: it.productId,
          brand: baseBrand,
          model: baseModel,
          manufacturerSerial: "",
          tagCode: "",
        });
      }
    }
    return defaults;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const groupedRows = useMemo(() => {
    const map = new Map<string, IntakeRow[]>();
    for (const row of rows) {
      if (!map.has(row.productId)) map.set(row.productId, []);
      map.get(row.productId)!.push(row);
    }
    return map;
  }, [rows]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/purchase-bills/${billId}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receivingLocationId,
          units: rows,
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to issue";
        throw new Error(msg);
      }

      setSuccess("Purchase bill issued successfully.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to issue");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "ISSUED") return null;

  return (
    <div className="rounded border bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Issue Purchase Bill</h2>
          <p className="text-sm text-gray-600">Posting will create stock movements and tracked units.</p>
        </div>
        <select
          className="border rounded px-2 py-1 text-sm bg-white"
          value={receivingLocationId}
          onChange={(e) => setReceivingLocationId(e.target.value)}
          disabled={submitting}
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.code} — {loc.name}
            </option>
          ))}
        </select>
      </div>

      {trackedItems.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">No tracked lines. Issue to post stock only.</p>
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60"
          >
            {submitting ? "Issuing..." : "Issue Purchase Bill"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Enter unit details for each tracked line. Manufacturer serial is required when the product requires serials; otherwise a
            shop tag will be generated if no serial is provided.
          </p>
          {trackedItems.map((item) => {
            const productRows = groupedRows.get(item.productId) ?? [];
            return (
              <div key={item.id} className="rounded border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.titleSnapshot}</p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  {item.product?.serialRequired ? (
                    <span className="text-xs text-orange-700">Serial required</span>
                  ) : (
                    <span className="text-xs text-gray-600">Serial optional</span>
                  )}
                </div>

                {productRows.map((row, idx) => {
                  const rowIndex = rows.indexOf(row);
                  return (
                    <div key={`${item.id}-${idx}`} className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
                    <input
                      className="border px-2 py-1"
                      placeholder="Brand"
                      value={row.brand}
                      onChange={(e) =>
                        setRows((prev) => {
                          const copy = [...prev];
                          copy[rowIndex] = {
                            ...row,
                            brand: e.target.value,
                          };
                          return copy;
                        })
                      }
                      disabled={submitting}
                    />
                    <input
                      className="border px-2 py-1"
                      placeholder="Model"
                      value={row.model}
                      onChange={(e) =>
                        setRows((prev) => {
                          const copy = [...prev];
                          copy[rowIndex] = {
                            ...row,
                            model: e.target.value,
                          };
                          return copy;
                        })
                      }
                      disabled={submitting}
                    />
                    <input
                      className="border px-2 py-1"
                      placeholder="Manufacturer serial (optional)"
                      value={row.manufacturerSerial}
                      onChange={(e) =>
                        setRows((prev) => {
                          const copy = [...prev];
                          copy[rowIndex] = {
                            ...row,
                            manufacturerSerial: e.target.value,
                          };
                          return copy;
                        })
                      }
                      disabled={submitting}
                    />
                    <input
                      className="border px-2 py-1"
                      placeholder="Shop tag (optional)"
                      value={row.tagCode}
                      onChange={(e) =>
                        setRows((prev) => {
                          const copy = [...prev];
                          copy[rowIndex] = {
                            ...row,
                            tagCode: e.target.value,
                          };
                          return copy;
                        })
                      }
                      disabled={submitting}
                    />
                    <div className="text-xs text-gray-600 self-center">
                      {row.manufacturerSerial ? "Serial will be used" : "Tag will be generated if blank"}
                    </div>
                  </div>
                  );
                })}
              </div>
            );
          })}

          <div className="space-y-2">
            {error && <p className="text-sm text-red-700">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60"
            >
              {submitting ? "Issuing..." : "Issue Purchase Bill"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
