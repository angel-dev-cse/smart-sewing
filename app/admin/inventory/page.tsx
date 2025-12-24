import Link from "next/link";
import type { ProductType } from "@prisma/client";
import { db } from "@/lib/db";

type Props = {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    stock?: string;
    active?: string;
    sort?: string;
  }>;
};

const TYPES = ["ALL", "MACHINE_SALE", "MACHINE_RENT", "PART"] as const;
const STOCK = ["ALL", "LOW", "OUT"] as const;
const ACTIVE = ["ALL", "ACTIVE", "INACTIVE"] as const;
const SORTS = ["UPDATED_DESC", "TITLE_ASC", "STOCK_ASC", "STOCK_DESC"] as const;

const LOW_STOCK_THRESHOLD = 3;

export default async function InventoryPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};

  const q = (sp.q ?? "").trim();
  const typeRaw = String(sp.type ?? "ALL").toUpperCase();
  const stockRaw = String(sp.stock ?? "ALL").toUpperCase();
  const activeRaw = String(sp.active ?? "ALL").toUpperCase();
  const sortRaw = String(sp.sort ?? "UPDATED_DESC").toUpperCase();

  const typeFilter: (typeof TYPES)[number] = TYPES.includes(typeRaw as any) ? (typeRaw as any) : "ALL";
  const stockFilter: (typeof STOCK)[number] = STOCK.includes(stockRaw as any) ? (stockRaw as any) : "ALL";
  const activeFilter: (typeof ACTIVE)[number] = ACTIVE.includes(activeRaw as any) ? (activeRaw as any) : "ALL";
  const sortKey: (typeof SORTS)[number] = SORTS.includes(sortRaw as any) ? (sortRaw as any) : "UPDATED_DESC";

  const orderBy =
    sortKey === "TITLE_ASC"
      ? ({ title: "asc" } as const)
      : sortKey === "STOCK_ASC"
        ? ({ stock: "asc" } as const)
        : sortKey === "STOCK_DESC"
          ? ({ stock: "desc" } as const)
          : ({ updatedAt: "desc" } as const);

  const where = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(typeFilter !== "ALL" ? { type: typeFilter as ProductType } : {}),
    ...(activeFilter === "ACTIVE" ? { isActive: true } : activeFilter === "INACTIVE" ? { isActive: false } : {}),
    ...(stockFilter === "OUT"
      ? { stock: 0 }
      : stockFilter === "LOW"
        ? { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } }
        : {}),
  };

  const products = await db.product.findMany({
    where,
    orderBy,
    take: 200,
  });

  function makeHref(next: { q?: string; type?: string; stock?: string; active?: string; sort?: string }) {
    const params = new URLSearchParams();
    const nextQ = (next.q ?? q).trim();
    const nextType = (next.type ?? typeFilter).toString();
    const nextStock = (next.stock ?? stockFilter).toString();
    const nextActive = (next.active ?? activeFilter).toString();
    const nextSort = (next.sort ?? sortKey).toString();

    if (nextQ) params.set("q", nextQ);
    if (nextType && nextType !== "ALL") params.set("type", nextType);
    if (nextStock && nextStock !== "ALL") params.set("stock", nextStock);
    if (nextActive && nextActive !== "ALL") params.set("active", nextActive);
    if (nextSort && nextSort !== "UPDATED_DESC") params.set("sort", nextSort);

    const qs = params.toString();
    return qs ? `/admin/inventory?${qs}` : "/admin/inventory";
  }

  const anyFilterOn = Boolean(q) || typeFilter !== "ALL" || stockFilter !== "ALL" || activeFilter !== "ALL" || sortKey !== "UPDATED_DESC";

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-gray-600">
            Showing <span className="font-mono">{products.length}</span> products
            {stockFilter === "LOW" ? (
              <>
                {" "}
                (low means ≤ <span className="font-mono">{LOW_STOCK_THRESHOLD}</span>)
              </>
            ) : null}
            .
          </p>
        </div>

        <Link className="rounded bg-black text-white px-3 py-1 text-sm" href="/admin/products/new">
          New product
        </Link>
      </div>

      {/* Filters */}
      <form action="/admin/inventory" className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-4">
          <label className="block text-xs text-gray-600 mb-1">Search</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title / slug..."
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Type</label>
          <select name="type" defaultValue={typeFilter} className="w-full border rounded px-2 py-2 text-sm bg-white">
            <option value="ALL">All</option>
            <option value="MACHINE_SALE">Machine sale</option>
            <option value="MACHINE_RENT">Machine rent</option>
            <option value="PART">Part</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Stock</label>
          <select name="stock" defaultValue={stockFilter} className="w-full border rounded px-2 py-2 text-sm bg-white">
            <option value="ALL">All</option>
            <option value="LOW">Low (≤ {LOW_STOCK_THRESHOLD})</option>
            <option value="OUT">Out (0)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Active</label>
          <select name="active" defaultValue={activeFilter} className="w-full border rounded px-2 py-2 text-sm bg-white">
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Sort</label>
          <select name="sort" defaultValue={sortKey} className="w-full border rounded px-2 py-2 text-sm bg-white">
            <option value="UPDATED_DESC">Updated (newest)</option>
            <option value="TITLE_ASC">Title (A → Z)</option>
            <option value="STOCK_ASC">Stock (low → high)</option>
            <option value="STOCK_DESC">Stock (high → low)</option>
          </select>
        </div>

        <div className="md:col-span-12 flex gap-3 items-center">
          <button className="rounded bg-black px-4 py-2 text-white text-sm">Apply</button>

          {anyFilterOn ? (
            <Link href="/admin/inventory" className="text-sm underline text-gray-700">
              Clear filters
            </Link>
          ) : null}
        </div>
      </form>

      {/* Table */}
      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Price</th>
              <th className="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <Link className="underline" href={`/admin/inventory/${p.id}`}>
                    {p.title}
                  </Link>
                  <div className="text-xs text-gray-500 font-mono">{p.slug}</div>
                  {!p.isActive ? (
                    <div className="text-xs text-red-700 font-mono">INACTIVE</div>
                  ) : null}
                </td>
                <td className="p-3 font-mono">{p.type}</td>
                <td className="p-3 font-mono">{p.stock}</td>
                <td className="p-3">৳ {p.price.toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">{new Date(p.updatedAt).toLocaleString()}</td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td className="p-3" colSpan={5}>
                  No products found.
                  {anyFilterOn ? (
                    <>
                      {" "}
                      <Link className="underline" href="/admin/inventory">
                        Clear filters
                      </Link>
                      .
                    </>
                  ) : null}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 mt-3">
        Showing up to <span className="font-mono">200</span> products.
        {anyFilterOn ? (
          <>
            {" "}
            <Link className="underline" href={makeHref({})}>
              Link to current filters
            </Link>
            .
          </>
        ) : null}
      </p>
    </div>
  );
}
