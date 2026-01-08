// app/api/admin/purchase-bills/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getDefaultLocationIds } from "@/lib/location-stock";
import { parseBdtToPaisa } from "@/lib/money";

type Body = {
  partyId?: string | null;
  supplierName?: string;
  supplierPhone?: string | null;
  notes?: string | null;

  items?: Array<{ productId: string; quantity: number; unitCost: number }>;
};

function normalizeInt(n: unknown, fallback = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.floor(x);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const partyId = body.partyId ? String(body.partyId) : null;

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "No items." }, { status: 400 });
    }

    // Resolve supplier party (optional)
    let party: { id: string; name: string; phone: string | null } | null = null;
    if (partyId) {
      party = await db.party.findUnique({
        where: { id: partyId },
        select: { id: true, name: true, phone: true },
      });
      if (!party) {
        return NextResponse.json(
          { error: "Selected supplier contact not found." },
          { status: 400 }
        );
      }
    }

    const supplierName = String(body.supplierName ?? "").trim() || party?.name || "";
    const supplierPhone = body.supplierPhone
      ? String(body.supplierPhone).trim()
      : party?.phone ?? null;

    if (!supplierName) {
      return NextResponse.json(
        { error: "Supplier name required (or select a supplier contact)." },
        { status: 400 }
      );
    }

    // Validate items
    for (const it of items) {
      const productId = String(it?.productId ?? "");
      const quantity = normalizeInt(it?.quantity, 0);
      const unitCost = parseBdtToPaisa(it?.unitCost, { allowZero: true, minPaisa: 0 });

      if (!productId) return NextResponse.json({ error: "Invalid productId." }, { status: 400 });
      if (!Number.isFinite(quantity) || quantity < 1)
        return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
      if (unitCost === null)
        return NextResponse.json({ error: "Invalid unit cost." }, { status: 400 });
    }

    const created = await db.$transaction(async (tx) => {
      await getDefaultLocationIds(tx);

      // ✅ Atomic billNo allocation
      // Check if counter exists, if not, initialize based on existing bills
      let counter = await tx.invoiceCounter.findUnique({
        where: { id: "purchase" },
        select: { nextNo: true },
      });

      let billNo: number;

      if (!counter) {
        // Counter doesn't exist - find max billNo to avoid conflicts
        const maxBill = await tx.purchaseBill.findFirst({
          orderBy: { billNo: "desc" },
          select: { billNo: true },
        });
        // Initialize counter to max+1 (or 1 if no bills exist)
        // Use this value directly, then update counter for next time
        billNo = maxBill ? maxBill.billNo + 1 : 1;

        await tx.invoiceCounter.create({
          data: { id: "purchase", nextNo: billNo + 1 },
        });
      } else {
        // Counter exists - increment and use the value
        counter = await tx.invoiceCounter.update({
          where: { id: "purchase" },
          data: { nextNo: { increment: 1 } },
          select: { nextNo: true },
        });
        billNo = counter.nextNo;
      }

      let subtotal = 0;

      const bill = await tx.purchaseBill.create({
        data: {
          billNo,
          supplierName,
          phone: supplierPhone,
          notes: body.notes ? String(body.notes) : null,
          status: "DRAFT",
          issuedAt: null,
          ...(party?.id ? { party: { connect: { id: party.id } } } : {}),
        },
        select: { id: true, billNo: true },
      });

      for (const it of items) {
        const productId = String(it.productId);
        const quantity = Math.floor(Number(it.quantity));
        const unitCost = parseBdtToPaisa(it.unitCost, { allowZero: true, minPaisa: 0 });
        if (unitCost === null) {
          throw new Error("Invalid unit cost.");
        }

        subtotal += unitCost * quantity;

        const p = await tx.product.findUnique({
          where: { id: productId },
          select: { title: true },
        });

        await tx.purchaseBillItem.create({
          data: {
            purchaseBillId: bill.id,
            productId,
            titleSnapshot: p?.title ?? "",
            unitCost,
            quantity,
          },
        });
      }

      await tx.purchaseBill.update({
        where: { id: bill.id },
        data: { subtotal, total: subtotal },
      });

      return bill;
    });

    return NextResponse.json({ id: created.id, billNo: created.billNo });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
