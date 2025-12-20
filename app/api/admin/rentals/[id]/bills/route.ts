import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing rental contract id." }, { status: 400 });
    }

    const body = await req.json();
    const periodStartRaw = String(body.periodStart ?? "").trim();
    const periodEndRaw = String(body.periodEnd ?? "").trim();

    if (!periodStartRaw || !periodEndRaw) {
      return NextResponse.json({ error: "Missing periodStart/periodEnd." }, { status: 400 });
    }

    const periodStart = new Date(periodStartRaw);
    const periodEnd = new Date(periodEndRaw);

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      return NextResponse.json({ error: "Invalid date(s)." }, { status: 400 });
    }

    if (periodEnd < periodStart) {
      return NextResponse.json({ error: "periodEnd must be >= periodStart." }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const contract = await tx.rentalContract.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!contract) {
        return { ok: false as const, status: 404 as const, error: "Contract not found." };
      }

      if (contract.status !== "ACTIVE") {
        return {
          ok: false as const,
          status: 400 as const,
          error: "Bills can only be generated for ACTIVE contracts.",
        };
      }

      // basic amount calculation: sum(monthlyRate * qty)
      const subtotal = contract.items.reduce(
        (sum, it) => sum + it.monthlyRate * it.quantity,
        0
      );

      // Prevent duplicates for same period (recommended)
      const existing = await tx.rentalBill.findFirst({
        where: {
          rentalContractId: contract.id,
          periodStart,
          periodEnd,
        },
        select: { id: true },
      });

      if (existing) {
        return {
          ok: false as const,
          status: 400 as const,
          error: "A bill for this period already exists.",
        };
      }

      // billNo counter (like invoiceNo)
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "rental-bill" },
        update: { nextNo: { increment: 1 } },
        create: { id: "rental-bill", nextNo: 2 },
        select: { nextNo: true },
      });
      const billNo = counter.nextNo - 1;

      const bill = await tx.rentalBill.create({
        data: {
          rentalContractId: contract.id,
          billNo,
          periodStart,
          periodEnd,
          subtotal,
          total: subtotal,
          status: "DRAFT",
          paymentStatus: "UNPAID",
        },
        select: { id: true },
      });

      return { ok: true as const, status: 200 as const, id: bill.id };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
