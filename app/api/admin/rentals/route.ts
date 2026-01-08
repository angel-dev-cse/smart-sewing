import { db } from "@/lib/db";
import { parseBdtToPaisa } from "@/lib/money";
import { NextResponse } from "next/server";

type RentalItemInput = {
  productId: unknown;
  quantity: unknown;
  monthlyRate: unknown;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const partyId = body.partyId ? String(body.partyId).trim() : null;

    const customerNameRaw = String(body.customerName ?? "").trim();
    const phoneRaw = body.phone ? String(body.phone).trim() : null;
    const addressLine1Raw = body.addressLine1 ? String(body.addressLine1).trim() : null;
    const city = body.city ? String(body.city).trim() : null;

    const deposit = parseBdtToPaisa(body.deposit ?? 0, {
      allowZero: true,
      minPaisa: 0,
    });
    const notes = body.notes ? String(body.notes).trim() : null;

    const items = Array.isArray(body.items) ? body.items : [];

    // customerName may come from selected party
    if (deposit === null) {
      return NextResponse.json({ error: "Deposit must be a non-negative amount." }, { status: 400 });
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
      const monthlyRate = parseBdtToPaisa(it.monthlyRate, { allowZero: false, minPaisa: 1 });
      if (!monthlyRate)
        return NextResponse.json({ error: "Monthly rate must be a positive amount." }, { status: 400 });
      it.monthlyRate = monthlyRate;
    }

    const created = await db.$transaction(async (tx) => {
      // Resolve party (optional)
      let party: { id: string; type: "CUSTOMER" | "SUPPLIER" | "BOTH"; name: string; phone: string | null; address: string | null } | null = null;
      if (partyId) {
        party = await tx.party.findUnique({
          where: { id: partyId },
          select: { id: true, type: true, name: true, phone: true, address: true },
        });
        if (!party) return { ok: false as const, error: "Selected customer contact not found." };
        if (!(party.type === "CUSTOMER" || party.type === "BOTH")) {
          return { ok: false as const, error: "Selected contact is not a customer." };
        }
      }

      const customerName = customerNameRaw || party?.name || "";
      const phone = phoneRaw ?? party?.phone ?? null;
      const addressLine1 = addressLine1Raw ?? party?.address ?? null;

      if (!customerName) {
        return { ok: false as const, error: "Missing customer name (or select a customer contact)." };
      }

      // Atomic contractNo increment using a single-row counter
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "rental_contract" },
        update: { nextNo: { increment: 1 } },
        create: { id: "rental_contract", nextNo: 1 },
        select: { nextNo: true },
      });

      const contractNo = counter.nextNo;

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
          ...(partyId ? { party: { connect: { id: partyId } } } : {}),
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
