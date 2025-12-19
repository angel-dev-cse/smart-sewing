import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function invLabel(n: number) {
  return `INV-${String(n).padStart(6, "0")}`;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) return { ok: false as const, status: 404 as const, error: "Order not found." };

      // Only generate invoice for CONFIRMED orders (standard workflow)
      if (order.status !== "CONFIRMED") {
        return {
          ok: false as const,
          status: 400 as const,
          error: "Order must be CONFIRMED before generating an invoice.",
        };
      }

      // Prevent duplicates
      if (order.salesInvoiceId) {
        return {
          ok: true as const,
          status: 200 as const,
          invoiceId: order.salesInvoiceId,
          already: true as const,
        };
      }

      // Create invoiceNo (same counter you used)
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "sales" },
        update: { nextNo: { increment: 1 } },
        create: { id: "sales", nextNo: 1 },
        select: { nextNo: true },
      });
      const invoiceNo = counter.nextNo;

      // Build invoice items using snapshots from order
      // (We keep the price and title that was captured at order time.)
      // If you don't store unitPrice on OrderItem, we use the snapshot fields you already do.
      const invoiceItems = order.items.map((it) => ({
        productId: it.productId,
        titleSnapshot: it.titleSnapshot,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
      }));

      // Invoice totals taken from order (same numbers)
      const invoice = await tx.salesInvoice.create({
        data: {
          invoiceNo,
          status: "ISSUED",
          issuedAt: new Date(),

          customerName: order.customerName,
          phone: order.phone,
          addressLine1: order.addressLine1,
          city: order.city,
          notes: order.notes,

          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus === "PAID" ? "PAID" : "UNPAID",

          subtotal: order.subtotal,
          discount: 0,
          deliveryFee: order.deliveryFee,
          total: order.total,

          items: { create: invoiceItems },
        },
        select: { id: true, invoiceNo: true },
      });

      // Link order → invoice
      await tx.order.update({
        where: { id: order.id },
        data: { salesInvoiceId: invoice.id },
      });

      // Optional: Add an inventory movement note for bookkeeping (NO stock change)
      // This is optional; if you prefer to keep movements strictly for stock changes, skip it.
      // For now: skip it.

      return {
        ok: true as const,
        status: 200 as const,
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        label: invLabel(invoice.invoiceNo),
      };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
