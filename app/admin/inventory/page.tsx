import Link from "next/link";
import { db } from "@/lib/db";

type Props = { searchParams?: Promise<{ q?: string }> };

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>

      <form className="mb-4 flex gap-2" action="/admin/inventory">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by title or slug..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>
        {q && (
          <Link className="underline text-sm self-center" href="/admin/inventory">
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
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.slug}</div>
                </td>
                <td className="p-3 whitespace-nowrap">{p.type}</td>
                <td className="p-3 whitespace-nowrap font-semibold">{p.stock}</td>
                <td className="p-3">
                  <Link className="underline" href={`/admin/inventory/${p.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
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
