import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerName = String(body.customerName ?? "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const addressLine1 = body.addressLine1 ? String(body.addressLine1).trim() : null;
    const city = body.city ? String(body.city).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    const deliveryFee = Number(body.deliveryFee ?? 0);
    const discount = Number(body.discount ?? 0);

    const items = Array.isArray(body.items) ? body.items : [];
    if (!customerName) return NextResponse.json({ error: "Customer name required" }, { status: 400 });
    if (!Number.isInteger(deliveryFee) || deliveryFee < 0)
      return NextResponse.json({ error: "Invalid delivery fee" }, { status: 400 });
    if (!Number.isInteger(discount) || discount < 0)
      return NextResponse.json({ error: "Invalid discount" }, { status: 400 });
    if (items.length === 0) return NextResponse.json({ error: "No items" }, { status: 400 });

    const productIds = items.map((it: any) => String(it.productId));
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const invoiceItems: Array<{
      productId: string;
      titleSnapshot: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    let subtotal = 0;
    for (const it of items) {
      const productId = String(it.productId);
      const quantity = Number(it.quantity);
      const unitPriceOverride = it.unitPriceOverride;

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }

      const p = productMap.get(productId);
      if (!p) return NextResponse.json({ error: "Product not found" }, { status: 400 });

      const unitPrice = Number.isInteger(unitPriceOverride) && unitPriceOverride >= 0 ? unitPriceOverride : p.price;

      subtotal += unitPrice * quantity;

      invoiceItems.push({
        productId,
        titleSnapshot: p.title,
        unitPrice,
        quantity,
      });
    }

    const total = Math.max(0, subtotal - discount + deliveryFee);

    const created = await db.$transaction(async (tx) => {
      // atomic invoiceNo increment using a single-row counter
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "sales" },
        update: { nextNo: { increment: 1 } },
        create: { id: "sales", nextNo: 1 },
        select: { nextNo: true },
      });
      const invoiceNo = counter.nextNo;

      const invoice = await tx.salesInvoice.create({
        data: {
          invoiceNo,
          customerName,
          phone,
          addressLine1,
          city,
          notes,
          subtotal,
          discount,
          deliveryFee,
          total,
          items: { create: invoiceItems },
        },
        select: { id: true, invoiceNo: true },
      });

      return invoice;
    });

    return NextResponse.json({ id: created.id, invoiceNo: created.invoiceNo });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
  
}
