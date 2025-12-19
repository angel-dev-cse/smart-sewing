import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "BANK_TRANSFER";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerName = String(body.customerName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const addressLine1 = String(body.addressLine1 ?? "").trim();
    const city = String(body.city ?? "").trim();
    const notes = body.notes ? String(body.notes).trim() : null;
    const paymentMethod = body.paymentMethod as PaymentMethod;
    const deliveryFee = Number(body.deliveryFee ?? 0);

    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName || !phone || !addressLine1 || !city) {
      return NextResponse.json({ error: "Missing customer fields." }, { status: 400 });
    }

    if (!["COD", "BKASH", "NAGAD", "BANK_TRANSFER"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    if (!Number.isInteger(deliveryFee) || deliveryFee < 0) {
      return NextResponse.json({ error: "Invalid delivery fee." }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No items in order." }, { status: 400 });
    }

    // Validate products + compute subtotal
    const productIds = items.map((it: any) => String(it.productId));
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;

    // Build order items
    const orderItemsData: Array<{
      productId: string;
      titleSnapshot: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    for (const it of items) {
      const productId = String(it.productId);
      const quantity = Number(it.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
      }

      const product = productMap.get(productId);
      if (!product) {
        return NextResponse.json({ error: "Product not found." }, { status: 400 });
      }

      if (quantity > product.stock) {
        return NextResponse.json(
          { error: `Not enough stock for ${product.title}.` },
          { status: 400 }
        );
      }

      subtotal += product.price * quantity;

      orderItemsData.push({
        productId,
        titleSnapshot: product.title,
        unitPrice: product.price,
        quantity,
      });
    }

    const total = subtotal + deliveryFee;

    // Transaction = create order + items + decrement stock
    // Transaction = create order + items + decrement stock + write inventory movements
    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerName,
          phone,
          addressLine1,
          city,
          notes,
          paymentMethod,
          subtotal,
          deliveryFee,
          total,
          items: { create: orderItemsData },
        },
        select: { id: true },
      });

      for (const it of orderItemsData) {
        // re-check stock inside transaction (safer than relying on pre-check)
        const p = await tx.product.findUnique({
          where: { id: it.productId },
          select: { stock: true, title: true },
        });

        if (!p) throw new Error("Product not found.");
        if (it.quantity > p.stock) throw new Error(`Not enough stock for ${p.title}.`);

        const beforeStock = p.stock;
        const afterStock = beforeStock - it.quantity;

        await tx.product.update({
          where: { id: it.productId },
          data: { stock: afterStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: it.productId,
            kind: "OUT",
            quantity: it.quantity,
            beforeStock,
            afterStock,
            note: null,
            orderId: created.id,
            refType: "ORDER",
            refId: created.id,
          },
        });
      }

      return created;
    });


    return NextResponse.json({ orderId: order.id });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
