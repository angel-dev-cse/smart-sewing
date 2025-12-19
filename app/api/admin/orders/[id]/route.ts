import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const ALLOWED_STATUS = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
const ALLOWED_PAYMENT = ["UNPAID", "PAID"] as const;

type OrderStatus = (typeof ALLOWED_STATUS)[number];
type PaymentStatus = (typeof ALLOWED_PAYMENT)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const nextStatus = body.status as OrderStatus | undefined;
    const nextPaymentStatus = body.paymentStatus as PaymentStatus | undefined;

    if (!nextStatus && !nextPaymentStatus) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    if (nextStatus && !ALLOWED_STATUS.includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    if (nextPaymentStatus && !ALLOWED_PAYMENT.includes(nextPaymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) {
        return { ok: false as const, status: 404 as const, error: "Order not found." };
      }

      // prevent reopening cancelled orders (MVP safety)
      if (order.status === "CANCELLED" && nextStatus && nextStatus !== "CANCELLED") {
        return {
          ok: false as const,
          status: 400 as const,
          error: "Cancelled orders cannot be reopened.",
        };
      }

      const statusChanging = Boolean(nextStatus && nextStatus !== order.status);

      // Refund stock ONLY when transitioning into CANCELLED from a non-cancelled status
      if (statusChanging && nextStatus === "CANCELLED" && order.status !== "CANCELLED") {
        for (const it of order.items) {
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
              note: "Refund stock due to order cancellation",
              orderId: order.id,
              refType: "ORDER",
              refId: order.id,
            },
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: {
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(nextPaymentStatus ? { paymentStatus: nextPaymentStatus } : {}),
        },
      });

      return { ok: true as const, status: 200 as const };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
