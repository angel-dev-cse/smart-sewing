import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Allow empty body (UI calls with no JSON)
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    let accountId = String(body.accountId ?? "").trim(); // optional

    const result = await db.$transaction(async (tx) => {
      const bill = await tx.rentalBill.findUnique({
        where: { id },
        include: { rentalContract: true },
      });

      if (!bill) return { ok: false as const, status: 404 as const, error: "Not found." };
      if (bill.status !== "ISSUED")
        return { ok: false as const, status: 400 as const, error: "Bill must be ISSUED." };
      if (bill.paymentStatus === "PAID")
        return { ok: true as const, status: 200 as const };

      // Default account if not supplied: CASH (create if missing)
      if (!accountId) {
        const cash =
          (await tx.ledgerAccount.findUnique({ where: { name: "CASH" }, select: { id: true } })) ??
          (await tx.ledgerAccount.create({ data: { name: "CASH" }, select: { id: true } }));
        accountId = cash.id;
      } else {
        const account = await tx.ledgerAccount.findUnique({
          where: { id: accountId },
          select: { id: true },
        });
        if (!account) return { ok: false as const, status: 404 as const, error: "Account not found." };
      }

      const cat = await tx.ledgerCategory.findUnique({
        where: { name: "Customer Payment" },
        select: { id: true },
      });

      await tx.rentalBill.update({
        where: { id: bill.id },
        data: { paymentStatus: "PAID" },
      });

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

      return { ok: true as const, status: 200 as const };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // keep a tiny bit of debug info (optional)
    const msg = typeof e?.message === "string" ? e.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
