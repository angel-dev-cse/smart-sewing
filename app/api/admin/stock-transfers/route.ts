import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Body = {
  fromLocationId?: unknown;
  toLocationId?: unknown;
  items?: Array<{ productId: unknown; quantity: unknown }>;
  notes?: unknown;
};

const COUNTER_ID = "stock-transfer";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const fromLocationId = String(body.fromLocationId ?? "").trim();
    const toLocationId = String(body.toLocationId ?? "").trim();
    const notes = body.notes == null ? null : String(body.notes).trim();

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = rawItems
      .map((it) => ({
        productId: String((it as any)?.productId ?? "").trim(),
        quantity: Math.floor(Number((it as any)?.quantity ?? 0)),
      }))
      .filter((it) => it.productId && Number.isFinite(it.quantity) && it.quantity > 0);

    if (!fromLocationId || !toLocationId) {
      return NextResponse.json({ error: "fromLocationId and toLocationId are required" }, { status: 400 });
    }
    if (fromLocationId === toLocationId) {
      return NextResponse.json({ error: "From and To locations must be different" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    const res = await db.$transaction(async (tx) => {
      const [fromLoc, toLoc] = await Promise.all([
        tx.location.findUnique({ where: { id: fromLocationId } }),
        tx.location.findUnique({ where: { id: toLocationId } }),
      ]);

      if (!fromLoc || !fromLoc.isActive) {
        throw new Error("From location not found (or inactive).");
      }
      if (!toLoc || !toLoc.isActive) {
        throw new Error("To location not found (or inactive).");
      }

      const productIds = Array.from(new Set(items.map((i) => i.productId)));
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, title: true, stock: true },
      });

      if (products.length !== productIds.length) {
        throw new Error("One or more products were not found.");
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      const fromStocks = await tx.locationStock.findMany({
        where: { locationId: fromLocationId, productId: { in: productIds } },
        select: { productId: true, quantity: true },
      });

      const fromStockMap = new Map(fromStocks.map((s) => [s.productId, s.quantity]));

      for (const it of items) {
        const have = fromStockMap.get(it.productId) ?? 0;
        if (it.quantity > have) {
          const p = productMap.get(it.productId);
          throw new Error(
            `Not enough stock in ${fromLoc.code}. Product: ${p?.title ?? it.productId}. Have ${have}, need ${it.quantity}.`
          );
        }
      }

      const counter = await tx.invoiceCounter.upsert({
        where: { id: COUNTER_ID },
        create: { id: COUNTER_ID, nextNo: 1 },
        update: {},
        select: { nextNo: true },
      });

      const transferNo = counter.nextNo;

      const transfer = await tx.stockTransfer.create({
        data: {
          transferNo,
          status: "ISSUED",
          fromLocationId,
          toLocationId,
          notes: notes || null,
          issuedAt: new Date(),
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              titleSnapshot: productMap.get(it.productId)!.title,
              quantity: it.quantity,
            })),
          },
        },
        select: { id: true, transferNo: true },
      });

      await tx.invoiceCounter.update({
        where: { id: COUNTER_ID },
        data: { nextNo: { increment: 1 } },
      });

      for (const it of items) {
        await tx.locationStock.upsert({
          where: { locationId_productId: { locationId: fromLocationId, productId: it.productId } },
          create: { locationId: fromLocationId, productId: it.productId, quantity: -it.quantity },
          update: { quantity: { decrement: it.quantity } },
        });

        await tx.locationStock.upsert({
          where: { locationId_productId: { locationId: toLocationId, productId: it.productId } },
          create: { locationId: toLocationId, productId: it.productId, quantity: it.quantity },
          update: { quantity: { increment: it.quantity } },
        });

        const p = productMap.get(it.productId)!;

        await tx.inventoryMovement.create({
          data: {
            productId: it.productId,
            kind: "OUT",
            quantity: it.quantity,
            beforeStock: p.stock,
            afterStock: p.stock,
            note: `Transfer ST-${String(transferNo).padStart(6, "0")} ${fromLoc.code} → ${toLoc.code}`,
            refType: "STOCK_TRANSFER",
            refId: transfer.id,
            fromLocationId,
            toLocationId,
          },
        });
      }

      return transfer;
    });

    return NextResponse.json({ ok: true, ...res });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
