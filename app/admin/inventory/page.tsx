import Link from "next/link";
import { db } from "@/lib/db";

type Props = { searchParams?: Promise<{ q?: string }> };

const LOW_STOCK_THRESHOLD = 2;

export default async function AdminInventoryPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const products = await db.product.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  function clearHref() {
    return "/admin/inventory";
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-gray-600">
            Products + current stock. Use ledger for audit details.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded border bg-white px-3 py-1 hover:bg-gray-50" href="/admin/inventory/adjust">
            Adjust stock
          </Link>
          <Link className="rounded border bg-white px-3 py-1 hover:bg-gray-50" href="/admin/inventory/movements">
            Movements
          </Link>
          <Link className="rounded border bg-white px-3 py-1 hover:bg-gray-50" href="/admin/inventory/adjustments">
            Adjustments
          </Link>
        </div>
      </div>

      {/* Search */}
      <form action="/admin/inventory" className="mb-4 flex gap-2 items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by title or slug..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>

        {q && (
          <Link href={clearHref()} className="text-sm underline text-gray-700">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Type</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Manage</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => {
              const low = p.stock <= LOW_STOCK_THRESHOLD;
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-gray-500">{p.slug}</div>
                  </td>

                  <td className="p-3 whitespace-nowrap">{p.type}</td>

                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{p.stock}</span>
                      {low && (
                        <span className="text-xs rounded border px-2 py-0.5 bg-yellow-50 text-yellow-800 border-yellow-200">
                          Low
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <Link className="underline" href={`/admin/inventory/${p.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}

            {products.length === 0 && (
              <tr>
                <td className="p-3" colSpan={4}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
