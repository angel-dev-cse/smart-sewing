import Link from "next/link";
import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";

type Props = {
  searchParams?: Promise<{ status?: string; q?: string }>;
};

const STATUSES = ["ALL", "ISSUED", "DRAFT", "CANCELLED"] as const;

function fmt(no: number) {
  return `WO-${String(no).padStart(6, "0")}`;
}

export default async function AdminWriteOffsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const statusRaw = (sp.status ?? "ISSUED").toUpperCase();
  const q = (sp.q ?? "").trim();

  const status = STATUSES.includes(statusRaw as (typeof STATUSES)[number])
    ? (statusRaw as (typeof STATUSES)[number])
    : "ISSUED";

  const qNo = Number(q);
  const qNoOk = Number.isFinite(qNo) && qNo > 0 && Math.floor(qNo) === qNo;

  const writeOffs = await db.writeOff.findMany({
    where: {
      ...(status !== "ALL" ? { status: status as "DRAFT" | "ISSUED" | "CANCELLED" } : {}),
      ...(q
        ? {
            OR: [
              ...(qNoOk ? [{ writeOffNo: qNo }] : []),
              { id: { contains: q, mode: "insensitive" } },
              { reason: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  function href(nextStatus: string, nextQ: string) {
    const params = new URLSearchParams();
    params.set("status", nextStatus);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    return `/admin/write-offs?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Write-offs</h1>
        <Link href="/admin/write-offs/new" className="rounded bg-black px-4 py-2 text-white text-sm">
          New Write-off
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={href(s, q)}
              className={["rounded px-3 py-1 text-sm border", active ? "bg-black text-white border-black" : "bg-white"].join(" ")}
            >
              {s}
            </Link>
          );
        })}
      </div>

      <form action="/admin/write-offs" className="mb-4 flex gap-2 items-center">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by write-off no / reason..."
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
        />
        <button className="rounded bg-black px-4 py-2 text-white text-sm">Search</button>

        {q && (
          <Link href={href(status, "")} className="text-sm underline text-gray-700">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Write-off</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total value</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {writeOffs.map((wo) => (
              <tr key={wo.id} className="border-t">
                <td className="p-3 font-mono">
                  <Link className="underline" href={`/admin/write-offs/${wo.id}`}>
                    {fmt(wo.writeOffNo)}
                  </Link>
                </td>
                <td className="p-3">{wo.reason ?? <span className="text-gray-500">—</span>}</td>
                <td className="p-3 font-mono">{wo.status}</td>
                <td className="p-3 font-semibold whitespace-nowrap">
                  {formatBdtFromPaisa(wo.totalValue)}
                </td>
                <td className="p-3 whitespace-nowrap">{new Date(wo.createdAt).toLocaleString()}</td>
              </tr>
            ))}

            {writeOffs.length === 0 && (
              <tr>
                <td className="p-3" colSpan={5}>
                  No matching write-offs.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 mt-3">Showing latest 100 write-offs.</p>
    </div>
  );
}
