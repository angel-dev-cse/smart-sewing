import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";

type Props = {
  params: Promise<{ id: string }>;
};

function fmt(no: number) {
  return `WO-${String(no).padStart(6, "0")}`;
}

export default async function WriteOffDetailPage({ params }: Props) {
  const { id } = await params;

  const wo = await db.writeOff.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!wo) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Write-off not found</h1>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{fmt(wo.writeOffNo)}</h1>
        <div className="text-sm text-gray-600">
          Status: <span className="font-mono">{wo.status}</span>
        </div>
        <div className="text-sm text-gray-600">
          Created: {new Date(wo.createdAt).toLocaleString()}
        </div>
        {wo.reason ? (
          <div className="text-sm">
            Reason: <span className="font-semibold">{wo.reason}</span>
          </div>
        ) : null}
        {wo.notes ? (
          <div className="text-sm text-gray-700 mt-1">{wo.notes}</div>
        ) : null}
      </div>

      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Unit value</th>
              <th className="p-3">Line</th>
            </tr>
          </thead>
          <tbody>
            {wo.items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-3">{i.titleSnapshot}</td>
                <td className="p-3 font-mono">{i.quantity}</td>
                <td className="p-3 whitespace-nowrap">{formatBdtFromPaisa(i.unitValue)}</td>
                <td className="p-3 font-semibold whitespace-nowrap">
                  {formatBdtFromPaisa(i.unitValue * i.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-right font-bold">
        Total value: {formatBdtFromPaisa(wo.totalValue)}
      </div>
    </div>
  );
}
