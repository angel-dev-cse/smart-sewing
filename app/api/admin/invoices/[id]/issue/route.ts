// app/api/admin/invoices/[id]/issue/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { bumpLocationStock, getDefaultLocationIds, getLocationStockQty } from "@/lib/location-stock";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const issued = await db.$transaction(async (tx) => {
      const { shopId } = await getDefaultLocationIds(tx);

      const inv = await tx.salesInvoice.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!inv) throw new Error("Invoice not found.");
      if (inv.status !== "DRAFT") throw new Error("Only DRAFT invoices can be issued.");
      if (inv.items.length === 0) throw new Error("Invoice has no items.");

      // Validate + apply stock OUT (from SHOP)
      for (const it of inv.items) {
        const p = await tx.product.findUnique({
          where: { id: it.productId },
          select: { stock: true, title: true },
        });
        if (!p) throw new Error("Product not found.");
        if (p.stock < it.quantity) throw new Error(`Insufficient stock: ${p.title}`);

        const shopQty = await getLocationStockQty(tx, { productId: it.productId, locationId: shopId });
        if (shopQty < it.quantity) {
          throw new Error(`Not enough stock in SHOP. Product: ${p.title}. Have ${shopQty}, need ${it.quantity}.`);
        }
      }

      // Apply per item stock change + movement
      for (const it of inv.items) {
        const p = await tx.product.findUnique({
          where: { id: it.productId },
          select: { stock: true },
        });
        if (!p) throw new Error("Product not found.");

        const beforeStock = p.stock;
        const afterStock = beforeStock - it.quantity;

        await tx.product.update({
          where: { id: it.productId },
          data: { stock: afterStock },
        });

        await bumpLocationStock(tx, { productId: it.productId, locationId: shopId, delta: -it.quantity });

        await tx.inventoryMovement.create({
          data: {
            productId: it.productId,
            kind: "OUT",
            quantity: it.quantity,
            beforeStock,
            afterStock,
            refType: "SALES_INVOICE",
            refId: inv.id,
            fromLocationId: shopId,
            toLocationId: null,
          },
        });
      }

      // Mark invoice issued
      const updated = await tx.salesInvoice.update({
        where: { id: inv.id },
        data: {
          status: "ISSUED",
          issuedAt: new Date(),
        },
        select: { id: true },
      });

      return updated;
    });

    return NextResponse.json({ ok: true, id: issued.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
