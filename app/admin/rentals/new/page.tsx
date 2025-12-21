import { db } from "@/lib/db";
import NewRentalForm from "./ui";

export default async function NewRentalPage() {
  const products = await db.product.findMany({
    where: { isActive: true, type: "MACHINE_RENT" },
    orderBy: { title: "asc" },
    select: { id: true, title: true, stock: true },
  });

  const parties = await db.party.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, type: true },
  });

  return <NewRentalForm products={products} parties={parties} />;
}
