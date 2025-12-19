import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import InventoryAdjustForm from "./ui";

type Props = { params: Promise<{ id: string }> };

export default async function AdminInventoryProductPage({ params }: Props) {
  const { id } = await params;

  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();

  const movements = await db.inventoryMovement.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <p className="text-sm text-gray-600 font-mono">{product.slug}</p>
        <p className="mt-2 font-semibold">Current stock: {product.stock}</p>
        <Link className="underline text-sm" href="/admin/inventory">
          ← Back
        </Link>
      </div>

      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-3">Adjust stock</p>
        <InventoryAdjustForm productId={product.id} />
      </div>

      <div className="rounded border bg-white p-4">
        <p className="font-semibold mb-3">Recent movements</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-2">Time</th>
                <th className="p-2">Kind</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Before → After</th>
                <th className="p-2">Ref</th>
                <th className="p-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="p-2 whitespace-nowrap">{m.kind}</td>
                  <td className="p-2 whitespace-nowrap font-mono">
                    {m.kind === "ADJUST"
                      ? m.quantity >= 0
                        ? `+${m.quantity}`
                        : `${m.quantity}`
                      : m.quantity}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {m.beforeStock} → {m.afterStock}
                  </td>
                  <td className="p-2 whitespace-nowrap font-mono">
                    {m.orderId ? `ORDER:${m.orderId.slice(0, 10)}…` : m.refType && m.refId ? `${m.refType}:${m.refId}` : "-"}
                  </td>
                  <td className="p-2">{m.note ?? "-"}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td className="p-2" colSpan={6}>
                    No movements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-600 mt-3">Showing latest 50 movements.</p>
      </div>
    </div>
  );
}
