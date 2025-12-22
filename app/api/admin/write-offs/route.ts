import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Body = {
  reason?: unknown;
  notes?: unknown;
  items?: unknown;
};

const COUNTER_ID = "write-off";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    const items: Array<{ productId: string; quantity: number }> = [];
    for (const it of itemsRaw) {
      const productId = typeof (it as any)?.productId === "string" ? (it as any).productId : "";
      const quantity = Number((it as any)?.quantity);
      if (!productId) return NextResponse.json({ error: "Invalid item productId." }, { status: 400 });
      if (!Number.isFinite(quantity) || quantity < 1)
        return NextResponse.json({ error: "Invalid item quantity." }, { status: 400 });
      items.push({ productId, quantity: Math.floor(quantity) });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Add at least one write-off item." }, { status: 400 });
    }

    const createdId = await db.$transaction(async (tx) => {
      const counter = await tx.invoiceCounter.upsert({
        where: { id: COUNTER_ID },
        update: { nextNo: { increment: 1 } },
        create: { id: COUNTER_ID, nextNo: 1 },
        select: { nextNo: true },
      });
      const writeOffNo = counter.nextNo;

      // Calculate total value based on current product price snapshot
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
        select: { id: true, title: true, price: true, stock: true },
      });
      const map = new Map(products.map((p) => [p.id, p] as const));

      let totalValue = 0;
      for (const it of items) {
        const p = map.get(it.productId);
        if (!p) throw new Error(`Product not found: ${it.productId}`);
        if (p.stock < it.quantity) throw new Error(`Insufficient stock: ${p.title}`);
        totalValue += p.price * it.quantity;
      }

      const wo = await tx.writeOff.create({
        data: {
          writeOffNo,
          status: "ISSUED",
          reason: reason || null,
          notes: notes || null,
          totalValue,
          issuedAt: new Date(),
        },
        select: { id: true },
      });

      for (const it of items) {
        const p = map.get(it.productId)!;
        const qty = it.quantity;

        await tx.writeOffItem.create({
          data: {
            writeOffId: wo.id,
            productId: p.id,
            titleSnapshot: p.title,
            unitValue: p.price,
            quantity: qty,
          },
        });

        const before = p.stock;
        const after = before - qty;

        await tx.product.update({ where: { id: p.id }, data: { stock: after } });
        await tx.inventoryMovement.create({
          data: {
            productId: p.id,
            kind: "OUT",
            quantity: qty,
            beforeStock: before,
            afterStock: after,
            note: `Write-off WO-${String(writeOffNo).padStart(6, "0")}${reason ? ` (${reason})` : ""}`,
            refType: "WRITE_OFF",
            refId: wo.id,
          },
        });
      }

      return wo.id;
    });

    return NextResponse.json({ id: createdId });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
