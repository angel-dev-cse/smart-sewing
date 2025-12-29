import { db } from "@/lib/db";
import NewWriteOffUI from "./ui";

export default async function NewWriteOffPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, stock: true, price: true },
  });

  // Convert prices from paisa to BDT for UI display
  const productsWithBDTPrices = products.map(product => ({
    ...product,
    price: product.price / 100, // Convert from paisa to BDT
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">New Write-off</h1>
      <NewWriteOffUI products={productsWithBDTPrices} />
    </div>
  );
}
