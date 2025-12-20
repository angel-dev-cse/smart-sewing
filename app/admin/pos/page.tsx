import { db } from "@/lib/db";
import PosClient from "./ui";

export default async function AdminPosPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      price: true,
      stock: true,
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">POS — Counter Sale</h1>
      <PosClient products={products} />
    </div>
  );
}
