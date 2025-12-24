import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const REF_TYPE = "SALES_INVOICE_PAYMENT" as const;

type Body = {
  accountId?: unknown;
  amount?: unknown;
  note?: unknown;
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing invoice id." }, { status: 400 });

    const body = (await req.json()) as Body;

    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required." }, { status: 400 });
    }

    const amountRaw = Number(body.amount ?? 0);
    const amountRequested = Number.isFinite(amountRaw) ? Math.max(0, Math.floor(amountRaw)) : 0;
    if (amountRequested <= 0) {
      return NextResponse.json({ error: "amount must be > 0." }, { status: 400 });
    }

    const note = typeof body.note === "string" ? body.note.trim() : "";

    const result = await db.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.findUnique({
        where: { id },
        select: { id: true, invoiceNo: true, status: true, total: true, paymentStatus: true },
      });
      if (!inv) throw new Error("Invoice not found.");
      if (inv.status !== "ISSUED") throw new Error("Only ISSUED invoices can receive payments.");

      const account = await tx.ledgerAccount.findUnique({
        where: { id: accountId },
        select: { id: true, isActive: true, name: true },
      });
      if (!account || !account.isActive) throw new Error("Ledger account not found or inactive.");

      const paidAgg = await tx.ledgerEntry.aggregate({
        where: {
          direction: "IN",
          refType: REF_TYPE,
          refId: inv.id,
        },
        _sum: { amount: true },
      });
      const alreadyPaid = paidAgg._sum.amount ?? 0;
      const remaining = Math.max(0, inv.total - alreadyPaid);
      if (remaining <= 0) throw new Error("Invoice is already fully paid.");

      const amount = Math.min(amountRequested, remaining);

      const le = await tx.ledgerEntry.create({
        data: {
          accountId: account.id,
          direction: "IN",
          amount,
          note: note ? `Sales invoice #${inv.invoiceNo} payment — ${note}` : `Sales invoice #${inv.invoiceNo} payment`,
          refType: REF_TYPE,
          refId: inv.id,
        },
        select: { id: true },
      });

      const newPaid = alreadyPaid + amount;
      const newStatus = newPaid <= 0 ? "UNPAID" : newPaid < inv.total ? "PARTIAL" : "PAID";

      await tx.salesInvoice.update({
        where: { id: inv.id },
        data: {
          paymentStatus: newStatus,
        },
      });

      return { ledgerEntryId: le.id, paid: newPaid, remaining: Math.max(0, inv.total - newPaid), paymentStatus: newStatus };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
