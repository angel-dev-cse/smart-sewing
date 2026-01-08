import { db } from "@/lib/db";
import { bdtFromPaisa } from "@/lib/money";
import PosClient from "./ui";

export default async function AdminPosPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true, price: true, stock: true },
    orderBy: { title: "asc" },
  });

  // Convert prices from paisa to BDT for UI display
  const productsWithBDTPrices = products.map((product) => ({
    ...product,
    price: bdtFromPaisa(product.price),
  }));

  const parties = await db.party.findMany({
    where: { isActive: true },
    select: { id: true, name: true, phone: true, type: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">POS</h1>
      <PosClient products={productsWithBDTPrices} parties={parties} />
    </div>
  );
} 
