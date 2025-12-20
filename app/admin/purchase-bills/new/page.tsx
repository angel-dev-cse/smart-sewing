import { db } from "@/lib/db";
import PurchaseClient from "./ui";

export default async function NewPurchasePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, stock: true, price: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">New Purchase Bill</h1>
      <PurchaseClient products={products} />
    </div>
  );
}
