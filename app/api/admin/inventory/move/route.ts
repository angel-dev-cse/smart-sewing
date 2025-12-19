import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Action = "IN" | "OUT" | "SET";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const productId = String(body.productId || "");
    const action = body.action as Action;
    const qty = Number(body.quantity);
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    if (!["IN", "OUT", "SET"].includes(action))
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    if (!Number.isFinite(qty) || qty < 0)
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) return { ok: false as const, status: 404, error: "Product not found" };

      const beforeStock = product.stock;

      let kind: "IN" | "OUT" | "ADJUST" = "ADJUST";
      let quantity = 0;
      let afterStock = beforeStock;

      if (action === "IN") {
        kind = "IN";
        quantity = Math.floor(qty);
        afterStock = beforeStock + quantity;
      } else if (action === "OUT") {
        kind = "OUT";
        quantity = Math.floor(qty);
        afterStock = beforeStock - quantity;
        if (afterStock < 0) return { ok: false as const, status: 400, error: "Stock cannot go below 0" };
      } else {
        kind = "ADJUST";
        afterStock = Math.floor(qty);
        quantity = afterStock - beforeStock; // signed delta
        if (afterStock < 0) return { ok: false as const, status: 400, error: "Stock cannot be negative" };
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock: afterStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId,
          kind,
          quantity,
          beforeStock,
          afterStock,
          note: note || null,
          refType: "ADJUSTMENT",
          refId: null,
        },
      });

      return { ok: true as const, afterStock };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: (result as any).status });

    return NextResponse.json({ ok: true, afterStock: result.afterStock });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
