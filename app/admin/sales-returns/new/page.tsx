import { db } from "@/lib/db";
import NewSalesReturnUI from "./ui";

export default async function NewSalesReturnPage() {
  const invoices = await db.salesInvoice.findMany({
    where: { status: "ISSUED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      invoiceNo: true,
      customerName: true,
      phone: true,
      total: true,
      partyId: true,
      items: {
        select: {
          productId: true,
          titleSnapshot: true,
          unitPrice: true,
          quantity: true,
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">New Sales Return</h1>
      <NewSalesReturnUI invoices={invoices} />
    </div>
  );
}
