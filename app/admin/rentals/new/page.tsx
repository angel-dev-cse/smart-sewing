import { db } from "@/lib/db";
import NewRentalForm from "./ui";

export default async function NewRentalPage() {
  const products = await db.product.findMany({
    where: { isActive: true, type: "MACHINE_RENT" },
    orderBy: { title: "asc" },
    select: { id: true, title: true, stock: true },
  });

  return <NewRentalForm products={products} />;
}
