import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type RentalItemInput = {
  productId: unknown;
  quantity: unknown;
  monthlyRate: unknown;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerName = String(body.customerName ?? "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const addressLine1 = body.addressLine1 ? String(body.addressLine1).trim() : null;
    const city = body.city ? String(body.city).trim() : null;

    const deposit = Number(body.deposit ?? 0);
    const notes = body.notes ? String(body.notes).trim() : null;

    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName) {
      return NextResponse.json({ error: "Missing customerName." }, { status: 400 });
    }
    if (!Number.isInteger(deposit) || deposit < 0) {
      return NextResponse.json({ error: "Deposit must be a non-negative integer." }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "No items." }, { status: 400 });
    }

    const normalized: Array<{
      productId: string;
      quantity: number;
      monthlyRate: number;
    }> = items.map((it: RentalItemInput) => ({
      productId: String(it.productId ?? "").trim(),
      quantity: Number(it.quantity),
      monthlyRate: Number(it.monthlyRate),
    }));

    for (const it of normalized) {
      if (!it.productId) return NextResponse.json({ error: "Invalid productId." }, { status: 400 });
      if (!Number.isInteger(it.quantity) || it.quantity <= 0)
        return NextResponse.json({ error: "Quantity must be positive integer." }, { status: 400 });
      if (!Number.isInteger(it.monthlyRate) || it.monthlyRate <= 0)
        return NextResponse.json({ error: "Monthly rate must be positive integer." }, { status: 400 });
    }

    const created = await db.$transaction(async (tx) => {
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "rental_contract" },
        update: {},
        create: { id: "rental_contract", nextNo: 1 },
        select: { nextNo: true },
      });

      const contractNo = counter.nextNo;

      await tx.invoiceCounter.update({
        where: { id: "rental_contract" },
        data: { nextNo: contractNo + 1 },
      });

      const products = await tx.product.findMany({
        where: { id: { in: normalized.map((x) => x.productId) }, isActive: true },
        select: { id: true, title: true, type: true },
      });

      const map = new Map(products.map((p) => [p.id, p]));
      for (const it of normalized) {
        const p = map.get(it.productId);
        if (!p) return { ok: false as const, error: "Product not found." };
        if (p.type !== "MACHINE_RENT") {
          return { ok: false as const, error: `Product "${p.title}" is not rentable (must be MACHINE_RENT).` };
        }
      }

      const contract = await tx.rentalContract.create({
        data: {
          contractNo,
          customerName,
          phone,
          addressLine1,
          city,
          deposit,
          notes,
          items: {
            create: normalized.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              monthlyRate: it.monthlyRate,
              titleSnapshot: map.get(it.productId)!.title,
            })),
          },
        },
        select: { id: true },
      });

      return { ok: true as const, id: contract.id };
    });

    if (!created.ok) return NextResponse.json({ error: created.error }, { status: 400 });
    return NextResponse.json({ ok: true, id: created.id });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
