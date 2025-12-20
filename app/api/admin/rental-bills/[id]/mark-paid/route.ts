import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Body is optional for MVP
    let accountId: string | null = null;
    try {
      const body = await req.json();
      const maybe = String(body?.accountId ?? "").trim();
      if (maybe) accountId = maybe;
    } catch {
      // no body / invalid json -> ignore
    }

    const result = await db.$transaction(async (tx) => {
      const bill = await tx.rentalBill.findUnique({
        where: { id },
        select: { id: true, billNo: true, status: true, paymentStatus: true, total: true },
      });

      if (!bill) {
        return { ok: false as const, status: 404 as const, error: "Not found." };
      }
      if (bill.status !== "ISSUED") {
        return { ok: false as const, status: 400 as const, error: "Bill must be ISSUED." };
      }
      if (bill.paymentStatus === "PAID") {
        return { ok: true as const, status: 200 as const };
      }

      // Resolve accountId:
      // - Prefer provided accountId
      // - else fallback to "Cash"
      // - else fallback to first account
      if (accountId) {
        const ok = await tx.ledgerAccount.findUnique({
          where: { id: accountId },
          select: { id: true },
        });
        if (!ok) {
          return { ok: false as const, status: 404 as const, error: "Account not found." };
        }
      } else {
        const cash = await tx.ledgerAccount.findFirst({
          where: { name: { equals: "Cash", mode: "insensitive" } },
          select: { id: true },
        });

        if (cash) {
          accountId = cash.id;
        } else {
          const any = await tx.ledgerAccount.findFirst({ select: { id: true } });
          if (!any) {
            return {
              ok: false as const,
              status: 400 as const,
              error: "No ledger accounts exist. Create a Cash account first.",
            };
          }
          accountId = any.id;
        }
      }

      const cat = await tx.ledgerCategory.findFirst({
        where: { name: { equals: "Customer Payment", mode: "insensitive" } },
        select: { id: true },
      });

      await tx.rentalBill.update({
        where: { id: bill.id },
        data: { paymentStatus: "PAID" },
      });

      await tx.ledgerEntry.create({
        data: {
          accountId: accountId!,
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

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Helpful error for debugging
    return NextResponse.json(
      { error: typeof e?.message === "string" ? e.message : "Server error." },
      { status: 500 }
    );
  }
}
