import { db } from "@/lib/db";
import { bdtFromPaisa } from "@/lib/money";
import NewWriteOffUI from "./ui";

export default async function NewWriteOffPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, stock: true, price: true },
  });

  // Convert prices from paisa to BDT for UI display
  const productsWithBDTPrices = products.map((product) => ({
    ...product,
    price: bdtFromPaisa(product.price),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">New Write-off</h1>
      <NewWriteOffUI products={productsWithBDTPrices} />
    </div>
  );
}
