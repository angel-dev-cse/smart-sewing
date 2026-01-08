import { db } from "@/lib/db";
import { bdtFromPaisa } from "@/lib/money";
import NewInvoiceForm from "./ui";

export default async function NewInvoicePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, title: true, price: true, stock: true, type: true },
  });

  // Convert prices from paisa to BDT for UI display
  const productsWithBDTPrices = products.map((product) => ({
    ...product,
    price: bdtFromPaisa(product.price),
  }));

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">New Sales Invoice</h1>
      <p className="text-sm text-gray-600">
        Create a draft invoice for walk-in sales / machine transfers. You’ll issue it later.
      </p>

      <NewInvoiceForm products={productsWithBDTPrices} />
    </div>
  );
}
