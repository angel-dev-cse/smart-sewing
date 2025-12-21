import Link from "next/link";
import { db } from "@/lib/db";

type Props = {
  searchParams?: Promise<{ q?: string; type?: string }>;
};

const TYPES = ["ALL", "CUSTOMER", "SUPPLIER", "BOTH"] as const;

export default async function PartiesPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = String(sp.q ?? "").trim();
  const t = String(sp.type ?? "ALL").toUpperCase();

  const typeFilter = TYPES.includes(t as (typeof TYPES)[number]) ? t : "ALL";

  const parties = await db.party.findMany({
    where: {
      ...(typeFilter !== "ALL" ? { type: typeFilter as "CUSTOMER" | "SUPPLIER" | "BOTH" } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
              { tags: { has: q } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Parties</h1>
        <Link href="/admin/parties/new" className="underline">
          + New Party
        </Link>
      </div>

      {/* Filters */}
      <form action="/admin/parties" className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <select name="type" defaultValue={typeFilter} className="border rounded px-2 py-2 text-sm bg-white">
          {TYPES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name / phone / company / tag"
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>
        {(q || typeFilter !== "ALL") && (
          <Link href="/admin/parties" className="text-sm underline text-gray-700">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Company</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {parties.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <Link className="underline" href={`/admin/parties/${p.id}`}>
                    {p.name}
                  </Link>
                </td>
                <td className="p-3 font-mono">{p.type}</td>
                <td className="p-3">{p.phone ?? "—"}</td>
                <td className="p-3">{p.companyName ?? "—"}</td>
                <td className="p-3">
                  {p.tags?.length ? (
                    <span className="text-xs text-gray-700">{p.tags.join(", ")}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">{p.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}

            {parties.length === 0 && (
              <tr>
                <td className="p-3" colSpan={6}>
                  No matching parties.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">Showing latest {parties.length} (max 200).</p>
    </div>
  );
}
