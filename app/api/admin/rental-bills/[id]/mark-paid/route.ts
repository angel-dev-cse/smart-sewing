import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const accountId = String(body.accountId ?? "").trim();
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId." }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const bill = await tx.rentalBill.findUnique({
        where: { id },
        include: { rentalContract: true },
      });

      if (!bill) return { ok: false as const, status: 404 as const, error: "Not found." };
      if (bill.status !== "ISSUED")
        return { ok: false as const, status: 400 as const, error: "Bill must be ISSUED." };

      const account = await tx.ledgerAccount.findUnique({
        where: { id: accountId },
        select: { id: true },
      });
      if (!account) return { ok: false as const, status: 404 as const, error: "Account not found." };

      // If already PAID, still ensure we don't duplicate ledger entries.
      // We'll treat as idempotent:
      const existingEntry = await tx.ledgerEntry.findFirst({
        where: { refType: "RENTAL_BILL", refId: bill.id },
        select: { id: true },
      });

      // Category (optional)
      const cat = await tx.ledgerCategory.findUnique({
        where: { name: "Customer Payment" },
        select: { id: true },
      });

      // If not paid yet, mark paid
      if (bill.paymentStatus !== "PAID") {
        await tx.rentalBill.update({
          where: { id: bill.id },
          data: { paymentStatus: "PAID" },
        });
      }

      // Write ledger entry only once
      if (!existingEntry) {
        await tx.ledgerEntry.create({
          data: {
            accountId,
            categoryId: cat?.id ?? null,
            direction: "IN",
            amount: bill.total,
            note: `Rental bill #${bill.billNo} payment`,
            occurredAt: new Date(),
            refType: "RENTAL_BILL",
            refId: bill.id,
          },
        });
      }

      return { ok: true as const, status: 200 as const };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
