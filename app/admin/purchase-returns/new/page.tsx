import { db } from "@/lib/db";
import NewPurchaseReturnUI from "./ui";

export default async function NewPurchaseReturnPage() {
  const bills = await db.purchaseBill.findMany({
    where: { status: "ISSUED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      billNo: true,
      supplierName: true,
      phone: true,
      total: true,
      partyId: true,
      items: { select: { productId: true, titleSnapshot: true, unitCost: true, quantity: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">New Purchase Return</h1>
      <NewPurchaseReturnUI bills={bills} />
    </div>
  );
}
