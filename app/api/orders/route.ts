import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const ALLOWED_PAYMENT_METHODS = ["COD", "BKASH", "NAGAD", "BANK_TRANSFER"] as const;
type PaymentMethod = (typeof ALLOWED_PAYMENT_METHODS)[number];

type OrderItemInput = {
  productId: unknown;
  quantity: unknown;
};

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

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    if (!Number.isInteger(deliveryFee) || deliveryFee < 0) {
      return NextResponse.json({ error: "Invalid delivery fee." }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No items in order." }, { status: 400 });
    }

    // Normalize items
    const normalizedItems: Array<{
      productId: string;
      quantity: number;
    }> = items.map((it: OrderItemInput) => ({
      productId: String(it.productId),
      quantity: Number(it.quantity),
    }));

    for (const it of normalizedItems) {
      if (!it.productId) {
        return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
      }
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
      }
    }

    // Fetch products (outside tx for quick validation/UI errors)
    const productIds = normalizedItems.map((it) => it.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, title: true, price: true, stock: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Pre-check stock and build snapshot items
    let subtotal = 0;
    const orderItemsData: Array<{
      productId: string;
      titleSnapshot: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    for (const it of normalizedItems) {
      const p = productMap.get(it.productId);
      if (!p) {
        return NextResponse.json({ error: "Product not found." }, { status: 400 });
      }
      if (it.quantity > p.stock) {
        return NextResponse.json(
          { error: `Not enough stock for ${p.title}.` },
          { status: 400 }
        );
      }

      subtotal += p.price * it.quantity;
      orderItemsData.push({
        productId: p.id,
        titleSnapshot: p.title,
        unitPrice: p.price,
        quantity: it.quantity,
      });
    }

    const total = subtotal + deliveryFee;

    const created = await db.$transaction(async (tx) => {
      // Create order + items first
      const order = await tx.order.create({
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

      // Then decrement stock + write movements
      for (const it of orderItemsData) {
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
            orderId: order.id,
            refType: "ORDER",
            refId: order.id,
          },
        });
      }

      return order;
    });

    return NextResponse.json({ orderId: created.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
