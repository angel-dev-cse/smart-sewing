import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const productId = String(body.productId ?? "").trim();
    const mode = body.mode === "SET" ? "SET" : "DELTA";
    const value = Number(body.value);
    const reason = body.reason ? String(body.reason).trim() : null;

    if (!productId) {
      return NextResponse.json({ error: "Missing productId." }, { status: 400 });
    }

    if (!Number.isInteger(value)) {
      return NextResponse.json({ error: "Value must be an integer." }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, stock: true, title: true },
      });

      if (!product) {
        return { ok: false as const, status: 404 as const, error: "Product not found." };
      }

      const beforeStock = product.stock;
      const afterStock = mode === "SET" ? value : beforeStock + value;

      if (afterStock < 0) {
        return { ok: false as const, status: 400 as const, error: "Stock cannot go negative." };
      }

      const delta = afterStock - beforeStock;
      if (delta === 0) {
        return { ok: false as const, status: 400 as const, error: "No change in stock." };
      }

      // Create adjustment document
      const adj = await tx.stockAdjustment.create({
        data: { reason: reason ?? "Manual adjustment" },
        select: { id: true },
      });

      // Update product stock
      await tx.product.update({
        where: { id: product.id },
        data: { stock: afterStock },
      });

      // Create adjustment line item (note the field name)
      await tx.stockAdjustmentItem.create({
        data: {
          stockAdjustmentId: adj.id,
          productId: product.id,
          delta,
          beforeStock,
          afterStock,
          note: reason,
        },
      });

      // Write an ADJUST movement (signed quantity)
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          kind: "ADJUST",
          quantity: delta, // signed
          beforeStock,
          afterStock,
          refType: "ADJUSTMENT",
          refId: adj.id,
          note: reason ?? "Manual adjustment",
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
