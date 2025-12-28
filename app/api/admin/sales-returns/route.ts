import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { bumpLocationStock, getDefaultLocationIds } from "@/lib/location-stock";

type RefundMethod = "NONE" | "CASH" | "BKASH" | "NAGAD" | "BANK";
type PrismaRefundMethod = "CASH" | "BKASH" | "NAGAD" | "BANK";
type LedgerKind = "CASH" | "BKASH" | "NAGAD" | "BANK";

type Body = {
  salesInvoiceId?: unknown;
  items?: Array<{ productId: unknown; quantity: unknown }>;
  refundMethod?: unknown;
  refundAmount?: unknown;
  notes?: unknown;
};

const COUNTER_ID = "sales-return";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const salesInvoiceId = String(body.salesInvoiceId ?? "").trim();
    if (!salesInvoiceId) {
      return NextResponse.json({ error: "salesInvoiceId required." }, { status: 400 });
    }

    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    if (itemsRaw.length === 0) {
      return NextResponse.json({ error: "No items." }, { status: 400 });
    }

    const refundMethodRaw = String(body.refundMethod ?? "NONE").toUpperCase() as RefundMethod;
    const refundMethod: RefundMethod =
      refundMethodRaw === "CASH" ||
      refundMethodRaw === "BKASH" ||
      refundMethodRaw === "NAGAD" ||
      refundMethodRaw === "BANK"
        ? refundMethodRaw
        : "NONE";

    const refundAmountInput = Number(body.refundAmount ?? 0);
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    // normalize + validate requested quantities
    const reqItems = itemsRaw
      .map((it) => ({
        productId: String((it as any)?.productId ?? "").trim(),
        quantity: Math.floor(Number((it as any)?.quantity)),
      }))
      .filter((it) => it.productId && Number.isFinite(it.quantity) && it.quantity > 0);

    if (reqItems.length === 0) {
      return NextResponse.json({ error: "No valid return quantities." }, { status: 400 });
    }

    const created = await db.$transaction(async (tx) => {
      const { shopId } = await getDefaultLocationIds(tx);

      const inv = await tx.salesInvoice.findUnique({
        where: { id: salesInvoiceId },
        include: { items: true },
      });

      if (!inv) throw new Error("Sales invoice not found.");
      if (inv.status !== "ISSUED") throw new Error("Only ISSUED invoices can be returned.");

      // Build sold qty map
      const soldByProduct = new Map<string, { title: string; unitPrice: number; qtySold: number }>();
      for (const it of inv.items) {
        const prev = soldByProduct.get(it.productId);
        soldByProduct.set(it.productId, {
          title: it.titleSnapshot,
          unitPrice: it.unitPrice,
          qtySold: (prev?.qtySold ?? 0) + it.quantity,
        });
      }

      // Calculate already-returned quantities for this invoice (ISSUED returns only)
      const existingReturns = await tx.salesReturn.findMany({
        where: { salesInvoiceId: inv.id, status: "ISSUED" },
        include: { items: true },
      });

      const returnedByProduct = new Map<string, number>();
      for (const r of existingReturns) {
        for (const it of r.items) {
          returnedByProduct.set(it.productId, (returnedByProduct.get(it.productId) ?? 0) + it.quantity);
        }
      }

      // Validate against remaining returnable qty
      for (const it of reqItems) {
        const sold = soldByProduct.get(it.productId);
        if (!sold) throw new Error("Invalid product in return.");

        const alreadyReturned = returnedByProduct.get(it.productId) ?? 0;
        const remaining = sold.qtySold - alreadyReturned;

        if (remaining <= 0) {
          throw new Error(`No remaining qty to return for ${sold.title}.`);
        }

        if (it.quantity > remaining) {
          throw new Error(`Return qty exceeds remaining qty for ${sold.title}. Remaining: ${remaining}`);
        }
      }

      // Counter
      const counter = await tx.invoiceCounter.upsert({
        where: { id: COUNTER_ID },
        update: { nextNo: { increment: 1 } },
        create: { id: COUNTER_ID, nextNo: 1 },
        select: { nextNo: true },
      });
      const returnNo = counter.nextNo;

      let subtotal = 0;

      const sr = await tx.salesReturn.create({
        data: {
          returnNo,
          status: "ISSUED",
          issuedAt: new Date(),
          salesInvoice: { connect: { id: inv.id } },
          ...(inv.partyId ? { party: { connect: { id: inv.partyId } } } : {}),
          customerName: inv.customerName,
          phone: inv.phone,
          notes: notes || null,
        },
        select: { id: true },
      });

      for (const it of reqItems) {
        const sold = soldByProduct.get(it.productId)!;
        const line = sold.unitPrice * it.quantity;
        subtotal += line;

        await tx.salesReturnItem.create({
          data: {
            salesReturnId: sr.id,
            productId: it.productId,
            titleSnapshot: sold.title,
            unitPrice: sold.unitPrice,
            quantity: it.quantity,
          },
        });

        const product = await tx.product.findUnique({
          where: { id: it.productId },
          select: { stock: true, title: true },
        });
        if (!product) throw new Error(`Product not found: ${it.productId}`);

        const beforeStock = product.stock;
        const afterStock = beforeStock + it.quantity;

        await tx.product.update({ where: { id: it.productId }, data: { stock: afterStock } });

        await bumpLocationStock(tx, { productId: it.productId, locationId: shopId, delta: it.quantity });

        await tx.inventoryMovement.create({
          data: {
            productId: it.productId,
            kind: "IN",
            quantity: it.quantity,
            beforeStock,
            afterStock,
            note: `Sales return SR-${String(returnNo).padStart(6, "0")}`,
            refType: "SALES_RETURN",
            refId: sr.id,
            fromLocationId: null,
            toLocationId: shopId,
          },
        });
      }

      const total = Math.max(0, subtotal);

      await tx.salesReturn.update({
        where: { id: sr.id },
        data: { subtotal: total, total },
      });

      // Optional refund
      const requestedRefund = Number.isFinite(refundAmountInput) ? Math.floor(refundAmountInput) : 0;
      const refundAmount =
        refundMethod === "NONE" ? 0 : Math.max(0, Math.min(total, requestedRefund || total));

      if (refundMethod !== "NONE" && refundAmount > 0) {
        const method = refundMethod as PrismaRefundMethod;

        const ledgerKind: LedgerKind = method;
        const account = await tx.ledgerAccount.findFirst({
          where: { kind: ledgerKind, isActive: true },
          select: { id: true },
        });

        let ledgerEntryId: string | null = null;
        if (account) {
          const le = await tx.ledgerEntry.create({
            data: {
              accountId: account.id,
              direction: "OUT",
              amount: refundAmount,
              note: `Sales return SR-${String(returnNo).padStart(6, "0")} refund`,
              refType: "SALES_RETURN",
              refId: sr.id,
            },
            select: { id: true },
          });
          ledgerEntryId = le.id;
        }

        await tx.salesReturnRefund.create({
          data: {
            salesReturnId: sr.id,
            method,
            amount: refundAmount,
            note: notes ? `Refund: ${notes}` : null,
            ...(ledgerEntryId ? { ledgerEntryId } : {}),
          },
        });
      }

      return sr.id;
    });

    return NextResponse.json({ id: created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
