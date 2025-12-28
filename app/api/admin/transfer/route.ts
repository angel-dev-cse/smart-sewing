// app/api/admin/transfers/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { adjustLocationStock } from "@/lib/location-stock";

type Body = {
  fromLocationId?: unknown;
  toLocationId?: unknown;
  notes?: unknown;
  items?: unknown; // Array<{ productId, quantity }>
};

const COUNTER_ID = "stock-transfer";

/**
 * MVP behavior:
 * - Create an ISSUED StockTransfer immediately (no draft flow yet).
 * - For each item:
 *   - validate LocationStock in fromLocation
 *   - decrement fromLocation, increment toLocation
 *   - create 2 InventoryMovement rows (OUT + IN) with from/to filled
 *   - Product.stock stays unchanged (transfer doesn't change total)
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const fromLocationId = typeof body.fromLocationId === "string" ? body.fromLocationId.trim() : "";
    const toLocationId = typeof body.toLocationId === "string" ? body.toLocationId.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!fromLocationId || !toLocationId) {
      return NextResponse.json({ error: "fromLocationId and toLocationId are required." }, { status: 400 });
    }
    if (fromLocationId === toLocationId) {
      return NextResponse.json({ error: "fromLocationId and toLocationId must be different." }, { status: 400 });
    }

    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    const items = itemsRaw
      .map((it: any) => ({
        productId: typeof it?.productId === "string" ? it.productId.trim() : "",
        quantity: Math.floor(Number(it?.quantity)),
      }))
      .filter((it) => it.productId && Number.isFinite(it.quantity) && it.quantity > 0);

    if (items.length === 0) {
      return NextResponse.json({ error: "Add at least one item." }, { status: 400 });
    }

    const created = await db.$transaction(async (tx) => {
      // Validate locations exist + active (MVP: allow inactive? -> block)
      const [fromLoc, toLoc] = await Promise.all([
        tx.location.findUnique({ where: { id: fromLocationId }, select: { id: true, code: true, name: true, isActive: true } }),
        tx.location.findUnique({ where: { id: toLocationId }, select: { id: true, code: true, name: true, isActive: true } }),
      ]);

      if (!fromLoc || !toLoc) throw new Error("Location not found.");
      if (!fromLoc.isActive) throw new Error(`From location is inactive: ${fromLoc.name}`);
      if (!toLoc.isActive) throw new Error(`To location is inactive: ${toLoc.name}`);

      // Transfer number counter (stable like invoices)
      const counter = await tx.invoiceCounter.upsert({
        where: { id: COUNTER_ID },
        update: { nextNo: { increment: 1 } },
        // create nextNo = 2, then billNo = nextNo - 1 pattern
        create: { id: COUNTER_ID, nextNo: 2 },
        select: { nextNo: true },
      });
      const transferNo = counter.nextNo - 1;

      // Create doc first
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNo,
          status: "ISSUED",
          fromLocation: { connect: { id: fromLoc.id } },
          toLocation: { connect: { id: toLoc.id } },
          notes: notes || null,
          issuedAt: new Date(),
        },
        select: { id: true, transferNo: true },
      });

      for (const it of items) {
        const product = await tx.product.findUnique({
          where: { id: it.productId },
          select: { id: true, title: true, stock: true },
        });
        if (!product) throw new Error(`Product not found: ${it.productId}`);

        // 1) location stock checks + updates
        try {
          await adjustLocationStock(tx as any, { locationId: fromLoc.id, productId: product.id, delta: -it.quantity });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Not enough stock in location.";
          throw new Error(`Not enough stock in ${fromLoc.code}. Product: ${product.title}. ${msg}`);
        }
        await adjustLocationStock(tx as any, { locationId: toLoc.id, productId: product.id, delta: +it.quantity });

        // 2) doc item
        await tx.stockTransferItem.create({
          data: {
            stockTransferId: transfer.id,
            productId: product.id,
            titleSnapshot: product.title,
            quantity: it.quantity,
          },
          select: { id: true },
        });

        // 3) movements (global stock unchanged; before/after equal)
        const beforeStock = product.stock;
        const afterStock = product.stock;

        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            kind: "OUT",
            quantity: it.quantity,
            beforeStock,
            afterStock,
            note: `Transfer ST-${String(transferNo).padStart(6, "0")} ${fromLoc.code} → ${toLoc.code}`,
            refType: "STOCK_TRANSFER",
            refId: transfer.id,
            fromLocationId: fromLoc.id,
            toLocationId: toLoc.id,
          },
          select: { id: true },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            kind: "IN",
            quantity: it.quantity,
            beforeStock,
            afterStock,
            note: `Transfer ST-${String(transferNo).padStart(6, "0")} ${fromLoc.code} → ${toLoc.code}`,
            refType: "STOCK_TRANSFER",
            refId: transfer.id,
            fromLocationId: fromLoc.id,
            toLocationId: toLoc.id,
          },
          select: { id: true },
        });
      }

      return transfer;
    });

    return NextResponse.json({ id: created.id, transferNo: created.transferNo });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
