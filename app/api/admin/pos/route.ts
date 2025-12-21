import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type PosPaymentMethod = "CASH" | "BKASH" | "NAGAD" | "BANK_TRANSFER";
type PrismaPaymentMethod = "COD" | "BKASH" | "NAGAD" | "BANK_TRANSFER";
type LedgerKind = "CASH" | "BKASH" | "NAGAD" | "BANK";

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
    // Your schema supports: COD/BKASH/NAGAD/BANK_TRANSFER
    const invoicePaymentMethod: PrismaPaymentMethod = pmRaw === "CASH" ? "COD" : (pmRaw as PrismaPaymentMethod);

    if (!["COD", "BKASH", "NAGAD", "BANK_TRANSFER"].includes(invoicePaymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    // Map POS -> LedgerAccountKind
    const ledgerKind: LedgerKind =
      pmRaw === "CASH" ? "CASH" : pmRaw === "BANK_TRANSFER" ? "BANK" : (pmRaw as LedgerKind);

    const result = await db.$transaction(async (tx) => {
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

      // invoice counter (sales)
      // Atomic invoiceNo allocation (same semantics as /api/admin/invoices):
      // InvoiceCounter.nextNo stores "last used invoiceNo".
      // We increment it and use the returned value as the new invoiceNo.
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "sales" },
        update: { nextNo: { increment: 1 } },
        create: { id: "sales", nextNo: 1 },
        select: { nextNo: true },
      });

      const invoiceNo = counter.nextNo;

      let subtotal = 0;

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
