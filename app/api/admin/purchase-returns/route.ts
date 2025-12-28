import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { bumpLocationStock, getDefaultLocationIds, getLocationStockQty } from "@/lib/location-stock";

type RefundMethod = "NONE" | "CASH" | "BKASH" | "NAGAD" | "BANK";
type PrismaRefundMethod = "CASH" | "BKASH" | "NAGAD" | "BANK";
type LedgerKind = "CASH" | "BKASH" | "NAGAD" | "BANK";

type Body = {
  purchaseBillId?: unknown;
  items?: unknown;
  refundMethod?: unknown;
  refundAmount?: unknown;
  notes?: unknown;
};

const COUNTER_ID = "purchase-return";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const purchaseBillId = typeof body.purchaseBillId === "string" ? body.purchaseBillId : "";
    if (!purchaseBillId) {
      return NextResponse.json({ error: "purchaseBillId is required." }, { status: 400 });
    }

    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    const parsedItems: Array<{ productId: string; quantity: number }> = [];
    for (const it of itemsRaw) {
      const item = it as { productId?: unknown; quantity?: unknown };
      const productId = typeof item.productId === "string" ? item.productId : "";
      const quantity = Number(item.quantity);
      if (!productId) return NextResponse.json({ error: "Invalid item productId." }, { status: 400 });
      if (!Number.isFinite(quantity) || quantity < 1)
        return NextResponse.json({ error: "Invalid item quantity." }, { status: 400 });
      parsedItems.push({ productId, quantity: Math.floor(quantity) });
    }
    if (parsedItems.length === 0) {
      return NextResponse.json({ error: "Add at least one return item." }, { status: 400 });
    }

    const refundMethodRaw = String(body.refundMethod ?? "NONE").toUpperCase() as RefundMethod;
    const refundMethod: RefundMethod =
      refundMethodRaw === "CASH" ||
      refundMethodRaw === "BKASH" ||
      refundMethodRaw === "NAGAD" ||
      refundMethodRaw === "BANK"
        ? refundMethodRaw
        : "NONE";

    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    const refundAmount = Number(body.refundAmount ?? 0);
    const refundAmountClean = Number.isFinite(refundAmount) ? Math.max(0, Math.floor(refundAmount)) : 0;

    const result = await db.$transaction(async (tx) => {
      const { shopId } = await getDefaultLocationIds(tx);

      const bill = await tx.purchaseBill.findUnique({
        where: { id: purchaseBillId },
        include: { items: true },
      });
      if (!bill) throw new Error("Purchase bill not found.");
      if (bill.status !== "ISSUED") throw new Error("Only ISSUED purchase bills can be returned.");

      // Validate quantities against purchased quantities
      const purchasedByProduct = new Map<string, { qty: number; unitCost: number; title: string }>();
      for (const it of bill.items) {
        const cur = purchasedByProduct.get(it.productId);
        if (!cur) {
          purchasedByProduct.set(it.productId, { qty: it.quantity, unitCost: it.unitCost, title: it.titleSnapshot });
        } else {
          purchasedByProduct.set(it.productId, {
            qty: cur.qty + it.quantity,
            unitCost: it.unitCost,
            title: it.titleSnapshot,
          });
        }
      }

      for (const it of parsedItems) {
        const purchased = purchasedByProduct.get(it.productId);
        if (!purchased) throw new Error("Return item not found in the selected purchase bill.");
        if (it.quantity > purchased.qty) {
          throw new Error(`Return qty exceeds purchased qty for ${purchased.title}.`);
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
      for (const it of parsedItems) {
        const purchased = purchasedByProduct.get(it.productId)!;
        subtotal += purchased.unitCost * it.quantity;
      }
      const total = Math.max(0, subtotal);

      const pr = await tx.purchaseReturn.create({
        data: {
          returnNo,
          status: "ISSUED",
          purchaseBill: { connect: { id: bill.id } },
      
          ...(bill.partyId ? { party: { connect: { id: bill.partyId } } } : {}),
      
          supplierName: bill.supplierName,
          phone: bill.phone,
          notes: notes || null,
          subtotal: total,
          total,
          issuedAt: new Date(),
        },
        select: { id: true },
      });

      for (const it of parsedItems) {
        const purchased = purchasedByProduct.get(it.productId)!;
        const qty = it.quantity;

        await tx.purchaseReturnItem.create({
          data: {
            purchaseReturnId: pr.id,
            productId: it.productId,
            titleSnapshot: purchased.title,
            unitCost: purchased.unitCost,
            quantity: qty,
          },
        });

        // Stock OUT (return to supplier)
        const product = await tx.product.findUnique({
          where: { id: it.productId },
          select: { stock: true, title: true },
        });
        if (!product) throw new Error(`Product not found: ${it.productId}`);
        if (product.stock < qty) {
          throw new Error(`Insufficient stock to return: ${product.title}`);
        }

        const shopQty = await getLocationStockQty(tx, { productId: it.productId, locationId: shopId });
        if (shopQty < qty) {
          throw new Error(`Not enough stock in SHOP to return. Product: ${product.title}. Have ${shopQty}, need ${qty}.`);
        }

        const before = product.stock;
        const after = before - qty;

        await tx.product.update({ where: { id: it.productId }, data: { stock: after } });
        await bumpLocationStock(tx, { productId: it.productId, locationId: shopId, delta: -qty });
        await tx.inventoryMovement.create({
          data: {
            productId: it.productId,
            kind: "OUT",
            quantity: qty,
            beforeStock: before,
            afterStock: after,
            note: `Purchase return PR-${String(returnNo).padStart(6, "0")}`,
            refType: "PURCHASE_RETURN",
            refId: pr.id,
            fromLocationId: shopId,
            toLocationId: null,
          },
        });
      }

      // Optional refund ledger (money IN)
      if (refundMethod !== "NONE") {
        const m = refundMethod as PrismaRefundMethod;
        const amount = Math.min(total, refundAmountClean || total);
        if (amount > 0) {
          const ledgerKind: LedgerKind = m;
          const account = await tx.ledgerAccount.findFirst({
            where: { kind: ledgerKind, isActive: true },
            select: { id: true },
          });

          let ledgerEntryId: string | null = null;
          if (account) {
            const le = await tx.ledgerEntry.create({
              data: {
                accountId: account.id,
                direction: "IN",
                amount,
                note: `Purchase return PR-${String(returnNo).padStart(6, "0")} refund`,
                refType: "PURCHASE_RETURN",
                refId: pr.id,
              },
              select: { id: true },
            });
            ledgerEntryId = le.id;
          }

          await tx.purchaseReturnRefund.create({
            data: {
              purchaseReturnId: pr.id,
              method: m,
              amount,
              note: `Refund from ${m}`,
              ...(ledgerEntryId ? { ledgerEntryId } : {}),
            },
          });
        }
      }

      return pr.id;
    });

    return NextResponse.json({ id: result });
  } catch (e: unknown) {
    const msg = e instanceof Error && typeof e.message === "string" ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
