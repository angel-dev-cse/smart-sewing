import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type PosPaymentMethod = "CASH" | "BKASH" | "NAGAD" | "BANK_TRANSFER";
type PrismaPaymentMethod = "COD" | "BKASH" | "NAGAD" | "BANK_TRANSFER";
type LedgerKind = "CASH" | "BKASH" | "NAGAD" | "BANK";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { customerName, phone, paymentMethod, items } = body as {
      customerName?: string;
      phone?: string | null;
      paymentMethod?: PosPaymentMethod;
      items?: Array<{ productId: string; quantity: number }>;
    };

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
    // Your schema supports: COD/BKASH/NAGAD/BANK_TRANSFER
    const invoicePaymentMethod: PrismaPaymentMethod =
      pmRaw === "CASH" ? "COD" : (pmRaw as PrismaPaymentMethod);

    if (!["COD", "BKASH", "NAGAD", "BANK_TRANSFER"].includes(invoicePaymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    // Map POS -> LedgerAccountKind
    const ledgerKind: LedgerKind =
      pmRaw === "CASH" ? "CASH" : pmRaw === "BANK_TRANSFER" ? "BANK" : (pmRaw as LedgerKind);

    const result = await db.$transaction(async (tx) => {
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "sales" },
        update: { nextNo: { increment: 1 } },
        create: { id: "sales", nextNo: 1 },
        select: { nextNo: true },
      });

      const invoiceNo = counter.nextNo;

      let subtotal = 0;

      const invoice = await tx.salesInvoice.create({
        data: {
          invoiceNo,
          status: "ISSUED",
          customerName: (customerName ?? "").trim() || "Walk-in customer",
          phone: phone ? String(phone) : null,
          paymentMethod: invoicePaymentMethod,
          issuedAt: new Date(),
        },
      });

      for (const it of items) {
        const qty = Number(it.quantity);

        const product = await tx.product.findUnique({
          where: { id: it.productId },
        });

        if (!product || product.stock < qty) {
          throw new Error(`Insufficient stock: ${product?.title ?? it.productId}`);
        }

        const before = product.stock;
        const after = before - qty;

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
          data: { stock: after },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            kind: "OUT",
            quantity: qty,
            beforeStock: before,
            afterStock: after,
            refType: "SALES_INVOICE",
            refId: invoice.id,
          },
        });
      }

      await tx.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          subtotal,
          total: subtotal,
          paymentStatus: "PAID",
        },
      });

      // Ledger entry (if account exists)
      const account = await tx.ledgerAccount.findFirst({
        where: { kind: ledgerKind },
        select: { id: true },
      });

      if (account) {
        await tx.ledgerEntry.create({
          data: {
            accountId: account.id,
            direction: "IN",
            amount: subtotal,
            note: `POS sale #${invoiceNo}`,
            refType: "SALES_INVOICE",
            refId: invoice.id,
          },
        });
      }

      return invoice.id;
    });

    return NextResponse.json({ invoiceId: result });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
