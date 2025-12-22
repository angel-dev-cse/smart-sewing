import { db } from "@/lib/db";
import NewWriteOffUI from "./ui";

export default async function NewWriteOffPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, stock: true, price: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">New Write-off</h1>
      <NewWriteOffUI products={products} />
    </div>
  );
}
