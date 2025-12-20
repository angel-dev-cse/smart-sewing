import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await db.$transaction(async (tx) => {
      const bill = await tx.rentalBill.findUnique({
        where: { id },
        select: { id: true, status: true, paymentStatus: true },
      });

      if (!bill) return { ok: false as const, status: 404 as const, error: "Not found." };

      if (bill.status === "CANCELLED") {
        return { ok: true as const, status: 200 as const };
      }

      // MVP safety: don’t allow cancelling paid bills (refund flow comes later)
      if (bill.paymentStatus === "PAID") {
        return {
          ok: false as const,
          status: 400 as const,
          error: "Paid bills cannot be cancelled. Use a refund flow (later).",
        };
      }

      await tx.rentalBill.update({
        where: { id: bill.id },
        data: { status: "CANCELLED" },
      });

      return { ok: true as const, status: 200 as const };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
