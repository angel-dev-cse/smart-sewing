// app/api/admin/purchase-bills/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { bumpLocationStock, getDefaultLocationIds } from "@/lib/location-stock";

type PaymentKind = "CASH" | "BKASH" | "NAGAD" | "BANK" | "NONE";

type Body = {
  partyId?: string | null;
  supplierName?: string;
  supplierPhone?: string | null;
  notes?: string | null;

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

      if (!productId) return NextResponse.json({ error: "Invalid productId." }, { status: 400 });
      if (!Number.isFinite(quantity) || quantity < 1)
        return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
      if (!Number.isFinite(unitCost) || unitCost < 0)
        return NextResponse.json({ error: "Invalid unit cost." }, { status: 400 });
    }

    // If paymentKind is NONE, ignore amountPaid
    const shouldCreatePayment = paymentKind !== "NONE" && amountPaid > 0;

    const purchasePaymentMethod =
      paymentKind === "NONE" ? null : (paymentKind as "CASH" | "BKASH" | "NAGAD" | "BANK");
    const ledgerKind =
      paymentKind === "NONE" ? null : (paymentKind as "CASH" | "BKASH" | "NAGAD" | "BANK");

    const created = await db.$transaction(async (tx) => {
      const { shopId } = await getDefaultLocationIds(tx);

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
          status: "ISSUED",
          issuedAt: new Date(),
          ...(party?.id ? { party: { connect: { id: party.id } } } : {}),
        },
        select: { id: true, billNo: true },
      });

      // Items + stock IN to SHOP + movement refs
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

          await bumpLocationStock(tx, { productId, locationId: shopId, delta: quantity });

          await tx.inventoryMovement.create({
            data: {
              productId,
              kind: "IN",
              quantity,
              beforeStock,
              afterStock,
              refType: "PURCHASE_BILL",
              refId: bill.id,
              fromLocationId: null,
              toLocationId: shopId,
            },
          });
        }
      }

      await tx.purchaseBill.update({
        where: { id: bill.id },
        data: { subtotal, total: subtotal },
      });

      // Optional payment + ledger
      if (shouldCreatePayment && purchasePaymentMethod && ledgerKind) {
        const account = await tx.ledgerAccount.findFirst({
          where: { kind: ledgerKind, isActive: true },
          select: { id: true, name: true },
        });

        const payAmount = Math.min(amountPaid, subtotal);

        const ledgerEntry = account
          ? await tx.ledgerEntry.create({
            data: {
              accountId: account.id,
              direction: "OUT",
              amount: payAmount,
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
            amount: payAmount,
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
