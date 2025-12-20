import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function StockAdjustmentDetailPage({ params }: Props) {
  const { id } = await params;

  const adj = await db.stockAdjustment.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });

  if (!adj) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock Adjustment</h1>
          <p className="text-sm text-gray-600">
            {new Date(adj.createdAt).toLocaleString()}
          </p>
          <p className="text-sm mt-2">
            <span className="font-semibold">Reason:</span>{" "}
            {adj.reason ?? "(no reason)"}
          </p>
          <p className="text-xs font-mono text-gray-500 mt-2">{adj.id}</p>
        </div>

        <div className="flex gap-2">
          <Link className="underline text-sm" href="/admin/inventory/adjustments">
            Back
          </Link>
          <Link className="underline text-sm" href="/admin/inventory/movement">
            Movements
          </Link>
        </div>
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Delta</th>
              <th className="p-3">Before</th>
              <th className="p-3">After</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {adj.items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{it.product.title}</div>
                  <div className="text-xs font-mono text-gray-500">{it.productId}</div>
                </td>

                <td className="p-3 whitespace-nowrap font-mono">
                  {it.delta > 0 ? `+${it.delta}` : `${it.delta}`}
                </td>

                <td className="p-3 whitespace-nowrap">{it.beforeStock}</td>
                <td className="p-3 whitespace-nowrap">{it.afterStock}</td>

                <td className="p-3">{it.note ?? "—"}</td>
              </tr>
            ))}

            {adj.items.length === 0 && (
              <tr>
                <td className="p-3" colSpan={5}>
                  No items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600">
        Tip: each adjustment also writes an Inventory Movement row with{" "}
        <span className="font-mono">refType=ADJUSTMENT</span>.
      </div>
    </div>
  );
}
