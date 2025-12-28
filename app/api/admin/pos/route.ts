import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { bumpLocationStock, getDefaultLocationIds, getLocationStockQty } from "@/lib/location-stock";

type PosPaymentMethod = "CASH" | "BKASH" | "NAGAD" | "BANK_TRANSFER";
type PrismaPaymentMethod = "COD" | "BKASH" | "NAGAD" | "BANK_TRANSFER";
type LedgerKind = "CASH" | "BKASH" | "NAGAD" | "BANK";

const PAYMENT_REF_TYPE = "SALES_INVOICE_PAYMENT" as const;

type Body = {
  partyId?: string | null;
  customerName?: string;
  phone?: string | null;
  paymentMethod?: PosPaymentMethod;
  items?: Array<{ productId: string; quantity: number }>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const { partyId, customerName, phone, paymentMethod, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items." }, { status: 400 });
    }

    // Basic validation
    for (const it of items) {
      if (!it?.productId || typeof it.productId !== "string") {
        return NextResponse.json({ error: "Invalid item productId." }, { status: 400 });
      }
      const q = Number(it.quantity);
      if (!Number.isFinite(q) || q < 1) {
        return NextResponse.json({ error: "Invalid item quantity." }, { status: 400 });
      }
    }

    const pmRaw = String(paymentMethod ?? "").toUpperCase() as PosPaymentMethod;

    // Map POS -> Prisma PaymentMethod enum
    // Schema supports: COD/BKASH/NAGAD/BANK_TRANSFER
    const invoicePaymentMethod: PrismaPaymentMethod =
      pmRaw === "CASH" ? "COD" : (pmRaw as PrismaPaymentMethod);

    if (!["COD", "BKASH", "NAGAD", "BANK_TRANSFER"].includes(invoicePaymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    // Map POS -> LedgerAccountKind
    const ledgerKind: LedgerKind =
      pmRaw === "CASH" ? "CASH" : pmRaw === "BANK_TRANSFER" ? "BANK" : (pmRaw as LedgerKind);

    const result = await db.$transaction(async (tx) => {
      const { shopId } = await getDefaultLocationIds(tx);

      // Resolve party (optional)
      let party: { id: string; name: string; phone: string | null } | null = null;
      if (partyId && typeof partyId === "string") {
        party = await tx.party.findUnique({
          where: { id: partyId },
          select: { id: true, name: true, phone: true },
        });
        if (!party) {
          throw new Error("Selected contact not found.");
        }
      }

      // Atomic invoiceNo allocation
      // InvoiceCounter.nextNo stores "last used invoiceNo".
      // We increment it and use the returned value as the new invoiceNo.
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "sales" },
        update: { nextNo: { increment: 1 } },
        create: { id: "sales", nextNo: 1 },
        select: { nextNo: true },
      });

      const invoiceNo = counter.nextNo;

      const finalCustomerName =
        (String(customerName ?? "").trim() || party?.name || "Walk-in customer").trim();
      const finalPhone = phone ? String(phone) : party?.phone ?? null;

      const invoice = await tx.salesInvoice.create({
        data: {
          invoiceNo,
          status: "ISSUED",
          partyId: party?.id ?? null,
          customerName: finalCustomerName,
          phone: finalPhone,
          paymentMethod: invoicePaymentMethod,
          paymentStatus: "UNPAID",
          issuedAt: new Date(),
        },
        select: { id: true },
      });

      // Pre-validate all stock before applying writes
      for (const it of items) {
        const qty = Math.floor(Number(it.quantity));

        const product = await tx.product.findUnique({
          where: { id: it.productId },
          select: { id: true, title: true, price: true, stock: true },
        });

        if (!product) throw new Error(`Product not found: ${it.productId}`);
        if (product.stock < qty) throw new Error(`Insufficient stock: ${product.title}`);

        const shopQty = await getLocationStockQty(tx, { productId: product.id, locationId: shopId });
        if (shopQty < qty) {
          throw new Error(
            `Not enough stock in SHOP. Product: ${product.title}. Have ${shopQty}, need ${qty}.`
          );
        }
      }

      let subtotal = 0;

      // Apply per item stock change + movement (OUT from SHOP)
      for (const it of items) {
        const qty = Math.floor(Number(it.quantity));

        const product = await tx.product.findUnique({
          where: { id: it.productId },
          select: { id: true, title: true, price: true, stock: true },
        });

        if (!product) throw new Error(`Product not found: ${it.productId}`);

        const beforeStock = product.stock;
        const afterStock = beforeStock - qty;

        subtotal += product.price * qty;

        await tx.salesInvoiceItem.create({
          data: {
            salesInvoiceId: invoice.id,
            productId: product.id,
            titleSnapshot: product.title,
            unitPrice: product.price,
            quantity: qty,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: afterStock },
        });

        await bumpLocationStock(tx, { productId: product.id, locationId: shopId, delta: -qty });

        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            kind: "OUT",
            quantity: qty,
            beforeStock,
            afterStock,
            refType: "SALES_INVOICE",
            refId: invoice.id,
            fromLocationId: shopId,
            toLocationId: null,
          },
        });
      }

      await tx.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          subtotal,
          total: subtotal,
        },
      });

      // POS assumption: sale is paid immediately via the selected method.
      // Record payment as a LedgerEntry so the invoice detail page can show it.
      const account = await tx.ledgerAccount.findFirst({
        where: { kind: ledgerKind, isActive: true },
        select: { id: true, name: true },
      });

      if (!account) {
        throw new Error(
          `No active ledger account found for ${ledgerKind}. Create one in Admin → Ledger, then retry.`
        );
      }

      await tx.ledgerEntry.create({
        data: {
          accountId: account.id,
          direction: "IN",
          amount: subtotal,
          note: `POS sale #${invoiceNo} payment (${account.name})`,
          refType: PAYMENT_REF_TYPE,
          refId: invoice.id,
        },
      });

      await tx.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          paymentStatus: subtotal > 0 ? "PAID" : "UNPAID",
        },
      });

      return { invoiceId: invoice.id, invoiceNo };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error && typeof e.message === "string" ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
