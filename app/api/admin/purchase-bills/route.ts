import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supplierName, items } = body;

    if (!supplierName || !items?.length)
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const result = await db.$transaction(async (tx) => {
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "purchase" },
        update: { nextNo: { increment: 1 } },
        create: { id: "purchase", nextNo: 1 },
        select: { nextNo: true },
      });

      const billNo = counter.nextNo;

      let subtotal = 0;

      const bill = await tx.purchaseBill.create({
        data: {
          billNo,
          supplierName,
          status: "ISSUED",
          issuedAt: new Date(),
        },
      });

      for (const it of items) {
        const p = await tx.product.findUnique({ where: { id: it.productId } });
        if (!p) throw new Error("Product missing");

        const before = p.stock;
        const after = before + it.quantity;

        subtotal += it.quantity * it.unitCost;

        await tx.purchaseBillItem.create({
          data: {
            purchaseBillId: bill.id,
            productId: p.id,
            titleSnapshot: p.title,
            unitCost: it.unitCost,
            quantity: it.quantity,
          },
        });

        await tx.product.update({
          where: { id: p.id },
          data: { stock: after },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: p.id,
            kind: "IN",
            quantity: it.quantity,
            beforeStock: before,
            afterStock: after,
            refType: "PURCHASE_BILL",
            refId: bill.id,
          },
        });
      }

      await tx.purchaseBill.update({
        where: { id: bill.id },
        data: { subtotal, total: subtotal },
      });

      return bill.id;
    });

    return NextResponse.json({ id: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
