import { db } from "@/lib/db";
import NewPurchaseUI from "./ui";

export default async function NewPurchasePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, stock: true, price: true },
  });

  const parties = await db.party.findMany({
    where: { isActive: true },
    select: { id: true, name: true, phone: true, type: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">New Purchase Bill</h1>
      <NewPurchaseUI products={products} parties={parties} />
    </div>
  );
}
