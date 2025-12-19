import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!inv) return { ok: false as const, status: 404 as const, error: "Invoice not found." };
      if (inv.status === "CANCELLED")
        return { ok: false as const, status: 400 as const, error: "Invoice already cancelled." };

      // If ISSUED, refund stock + ledger IN
      if (inv.status === "ISSUED") {
        for (const it of inv.items) {
          const p = await tx.product.findUnique({
            where: { id: it.productId },
            select: { stock: true },
          });
          if (!p) continue;

          const beforeStock = p.stock;
          const afterStock = beforeStock + it.quantity;

          await tx.product.update({
            where: { id: it.productId },
            data: { stock: afterStock },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: it.productId,
              kind: "IN",
              quantity: it.quantity,
              beforeStock,
              afterStock,
              note: `Cancelled invoice INV-${String(inv.invoiceNo).padStart(6, "0")}`,
              refType: "SALES_INVOICE",
              refId: inv.id,
            },
          });
        }
      }

      await tx.salesInvoice.update({
        where: { id: inv.id },
        data: { status: "CANCELLED" },
      });

      return { ok: true as const, status: 200 as const };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
