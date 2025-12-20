import Link from "next/link";
import { db } from "@/lib/db";

type Props = {
  searchParams?: Promise<{
    productId?: string;
    kind?: string;
    q?: string;
  }>;
};

function refHref(refType: string | null, refId: string | null) {
  if (!refType || !refId) return null;

  if (refType === "ORDER") return `/admin/orders/${refId}`;
  if (refType === "ADJUSTMENT") return `/admin/inventory/adjustments/${refId}`;

  // Future-proof for your invoice flow
  if (refType === "SALES_INVOICE" || refType === "INVOICE") {
    return `/admin/invoices/${refId}`;
  }

  return null;
}

function kindBadgeClass(kind: string) {
  // keep it simple; no colors required, just readable badges
  if (kind === "IN") return "bg-green-50 text-green-700 border-green-200";
  if (kind === "OUT") return "bg-red-50 text-red-700 border-red-200";
  return "bg-blue-50 text-blue-700 border-blue-200"; // ADJUST
}

export default async function InventoryMovementsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const productId = (sp.productId ?? "").trim();
  const kindRaw = (sp.kind ?? "").trim().toUpperCase();
  const q = (sp.q ?? "").trim();

  const kindFilter =
    kindRaw === "IN" || kindRaw === "OUT" || kindRaw === "ADJUST" ? kindRaw : "";

  // For dropdown
  const products = await db.product.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
    take: 1000,
  });

  const movements = await db.inventoryMovement.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(kindFilter ? { kind: kindFilter as "IN" | "OUT" | "ADJUST" } : {}),
      ...(q
        ? {
            OR: [
              { refId: { contains: q, mode: "insensitive" } },
              { orderId: { contains: q, mode: "insensitive" } },
              { note: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      product: { select: { title: true } },
    },
  });

  function clearHref() {
    return "/admin/inventory/movements";
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory ledger</h1>
          <p className="text-sm text-gray-600">
            Immutable stock movements (IN / OUT / ADJUST).
          </p>
        </div>

        <div className="flex gap-3 text-sm">
          <Link className="underline" href="/admin/inventory">
            Back to inventory
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form action="/admin/inventory/movements" className="mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Product</label>
          <select
            name="productId"
            defaultValue={productId}
            className="border rounded px-3 py-2 text-sm bg-white min-w-[240px]"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Kind</label>
          <select
            name="kind"
            defaultValue={kindFilter}
            className="border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="ADJUST">ADJUST</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Search</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="refId / orderId / note..."
            className="border rounded px-3 py-2 text-sm w-[260px]"
          />
        </div>

        <button className="rounded bg-black px-4 py-2 text-white text-sm">Apply</button>

        {(productId || kindFilter || q) && (
          <Link className="text-sm underline text-gray-700 ml-2" href={clearHref()}>
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Product</th>
              <th className="p-3">Kind</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Before</th>
              <th className="p-3">After</th>
              <th className="p-3">Ref</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>

          <tbody>
            {movements.map((m) => {
              const href = refHref(m.refType, m.refId);
              const refLabel = m.refType
                ? `${m.refType}${m.refId ? `:${m.refId.slice(0, 8)}…` : ""}`
                : "—";

              return (
                <tr key={m.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>

                  <td className="p-3">
                    <div className="font-medium">{m.product.title}</div>
                    <div className="text-xs text-gray-500 font-mono">{m.productId}</div>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={[
                        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
                        kindBadgeClass(m.kind),
                      ].join(" ")}
                    >
                      {m.kind}
                    </span>
                  </td>

                  <td className="p-3 whitespace-nowrap font-mono">
                    {m.kind === "ADJUST"
                      ? m.quantity > 0
                        ? `+${m.quantity}`
                        : `${m.quantity}`
                      : m.quantity}
                  </td>

                  <td className="p-3 whitespace-nowrap font-mono">{m.beforeStock}</td>
                  <td className="p-3 whitespace-nowrap font-mono">{m.afterStock}</td>

                  <td className="p-3 whitespace-nowrap">
                    {href ? (
                      <Link className="underline" href={href}>
                        {refLabel}
                      </Link>
                    ) : (
                      <span className="font-mono text-gray-700">{refLabel}</span>
                    )}
                  </td>

                  <td className="p-3">{m.note ?? "—"}</td>
                </tr>
              );
            })}

            {movements.length === 0 && (
              <tr>
                <td className="p-3" colSpan={8}>
                  No movements yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 mt-3">Showing latest 200 movements.</p>
    </div>
  );
}
