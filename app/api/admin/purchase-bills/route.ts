import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type PaymentKind = "CASH" | "BKASH" | "NAGAD" | "BANK" | "NONE";

type Body = {
  partyId?: string | null;
  supplierName?: string;
  supplierPhone?: string | null;
  notes?: string | null;

  // UI uses this
  paymentKind?: PaymentKind;
  amountPaid?: number;

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

    const paymentKind = (String(body.paymentKind ?? "NONE").toUpperCase() as PaymentKind) ?? "NONE";
    const amountPaidRaw = normalizeInt(body.amountPaid, 0);
    const amountPaid = Math.max(0, amountPaidRaw);

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
      const unitCost = normalizeInt(it?.unitCost, -1);

      if (!productId) {
        return NextResponse.json({ error: "Invalid productId." }, { status: 400 });
      }
      if (!Number.isFinite(quantity) || quantity < 1) {
        return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
      }
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        return NextResponse.json({ error: "Invalid unit cost." }, { status: 400 });
      }
    }

    // If paymentKind is NONE, ignore amountPaid
    const shouldCreatePayment = paymentKind !== "NONE" && amountPaid > 0;

    // Map paymentKind -> PurchasePaymentMethod + LedgerAccountKind
    const purchasePaymentMethod =
      paymentKind === "NONE" ? null : (paymentKind as "CASH" | "BKASH" | "NAGAD" | "BANK");
    const ledgerKind =
      paymentKind === "NONE"
        ? null
        : (paymentKind as "CASH" | "BKASH" | "NAGAD" | "BANK");

    const created = await db.$transaction(async (tx) => {
      // ✅ Atomic billNo allocation (prevents duplicate billNo under concurrent requests)
      const counter = await tx.invoiceCounter.upsert({
        where: { id: "purchase" },
        update: { nextNo: { increment: 1 } },
        create: { id: "purchase", nextNo: 1 },
        select: { nextNo: true },
      });

      const billNo = counter.nextNo;

      let subtotal = 0;

      // ✅ IMPORTANT: PurchaseBill does NOT accept `partyId` scalar in create.
      // Use relation connect instead.
      const bill = await tx.purchaseBill.create({
        data: {
          billNo,
          supplierName,
          phone: supplierPhone,
          notes: body.notes ? String(body.notes) : null,
          status: "ISSUED",
          issuedAt: new Date(),

          ...(party?.id ? { party: { connect: { id: party.id } } } : {}),
        },
        select: { id: true, billNo: true },
      });

      // Items + stock IN + movement refs
      for (const it of items) {
        const productId = String(it.productId);
        const quantity = Math.floor(Number(it.quantity));
        const unitCost = Math.floor(Number(it.unitCost));

        subtotal += unitCost * quantity;

        const p = await tx.product.findUnique({
          where: { id: productId },
          select: { title: true, stock: true },
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

        if (p) {
          const beforeStock = p.stock;
          const afterStock = beforeStock + quantity;

          await tx.product.update({
            where: { id: productId },
            data: { stock: afterStock },
          });

          await tx.inventoryMovement.create({
            data: {
              productId,
              kind: "IN",
              quantity,
              beforeStock,
              afterStock,
              refType: "PURCHASE_BILL",
              refId: bill.id,
            },
          });
        }
      }

      await tx.purchaseBill.update({
        where: { id: bill.id },
        data: {
          subtotal,
          total: subtotal,
        },
      });

      // ✅ Optional: record payment + link to ledger (Phase 7B "finish now")
      if (shouldCreatePayment && purchasePaymentMethod && ledgerKind) {
        // Pick account of that kind
        const account = await tx.ledgerAccount.findFirst({
          where: { kind: ledgerKind, isActive: true },
          select: { id: true, name: true },
        });

        // Create ledger entry OUT (money leaving the business)
        const ledgerEntry = account
          ? await tx.ledgerEntry.create({
            data: {
              accountId: account.id,
              direction: "OUT",
              amount: Math.min(amountPaid, subtotal), // don’t pay more than bill in MVP
              note: `Purchase bill PB-${String(billNo).padStart(6, "0")} payment`,
              refType: "PURCHASE_BILL",
              refId: bill.id,
            },
            select: { id: true },
          })
          : null;

        await tx.purchasePayment.create({
          data: {
            purchaseBillId: bill.id,
            method: purchasePaymentMethod,
            amount: Math.min(amountPaid, subtotal),
            note: account ? `Paid from ${account.name}` : "Payment recorded (no ledger account found)",
            ledgerEntryId: ledgerEntry?.id ?? null,
          },
        });
      }

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
