import Link from "next/link";
import { db } from "@/lib/db";

export default async function PartiesPage() {
  const parties = await db.party.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Parties</h1>
        <Link href="/admin/parties/new" className="underline">
          + New Party
        </Link>
      </div>

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Phone</th>
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
                <td className="p-3">{p.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
