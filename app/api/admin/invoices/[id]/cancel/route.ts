// app/api/admin/invoices/[id]/cancel/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { bumpLocationStock, getDefaultLocationIds } from "@/lib/location-stock";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cancelled = await db.$transaction(async (tx) => {
      const { shopId } = await getDefaultLocationIds(tx);

      const inv = await tx.salesInvoice.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!inv) throw new Error("Invoice not found.");
      if (inv.status !== "ISSUED") throw new Error("Only ISSUED invoices can be cancelled.");

      // Reverse stock OUT by adding back to SHOP
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

        await bumpLocationStock(tx, { productId: it.productId, locationId: shopId, delta: it.quantity });

        await tx.inventoryMovement.create({
          data: {
            productId: it.productId,
            kind: "IN",
            quantity: it.quantity,
            beforeStock,
            afterStock,
            note: "Cancel invoice (stock restore)",
            refType: "SALES_INVOICE_CANCEL",
            refId: inv.id,
            fromLocationId: null,
            toLocationId: shopId,
          },
        });
      }

      const updated = await tx.salesInvoice.update({
        where: { id: inv.id },
        data: {
          status: "CANCELLED",
        },
        select: { id: true },
      });

      return updated;
    });

    return NextResponse.json({ ok: true, id: cancelled.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
