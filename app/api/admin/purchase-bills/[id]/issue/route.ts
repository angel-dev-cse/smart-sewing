import { db } from "@/lib/db";
import { bumpLocationStock, getDefaultLocationIds } from "@/lib/location-stock";
import { prepareTrackedUnits } from "@/lib/purchase-issue";
import { NextResponse } from "next/server";

type IssueBody = {
  receivingLocationId?: string;
  units?: Array<{
    productId: string;
    brand?: string;
    model?: string;
    manufacturerSerial?: string | null;
    tagCode?: string | null;
  }>;
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as IssueBody;

    const bill = await db.purchaseBill.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                type: true,
                stock: true,
                isAssetTracked: true,
                serialRequired: true,
                brand: true,
                model: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!bill) return NextResponse.json({ error: "Purchase bill not found" }, { status: 404 });
    if (bill.status === "ISSUED")
      return NextResponse.json({ error: "Already issued", code: "DOC_ALREADY_ISSUED" }, { status: 409 });

    const result = await db.$transaction(async (tx) => {
      const { shopId } = await getDefaultLocationIds(tx);
      const receivingLocationId = body.receivingLocationId || shopId;

      const location = await tx.location.findUnique({
        where: { id: receivingLocationId },
        select: { id: true, isActive: true },
      });

      if (!location || !location.isActive) {
        throw new Error("Invalid receiving location");
      }

      const trackedLines = bill.items
        .filter((it) => it.product?.isAssetTracked)
        .map((it) => ({ product: it.product!, quantity: it.quantity }));

      const rawUnits = Array.isArray(body.units) ? body.units : [];

      let preparedUnits: Awaited<ReturnType<typeof prepareTrackedUnits>>;

      if (trackedLines.length > 0) {
        preparedUnits = await prepareTrackedUnits({ trackedLines, rawUnits, db: tx });
        if ("error" in preparedUnits) {
          throw new Error(preparedUnits.error);
        }

        const duplicateExisting = await tx.unit.findMany({
          where: { uniqueSerialKey: { in: preparedUnits.units.map((u) => u.uniqueSerialKey) } },
          select: { id: true, uniqueSerialKey: true },
        });

        if (duplicateExisting.length > 0) {
          throw new Error("Duplicate serials/tags already exist");
        }
      } else {
        preparedUnits = { units: [] };
      }

      for (const it of bill.items) {
        const productId = it.productId;
        const quantity = it.quantity;

        const beforeStock = it.product?.stock ?? 0;
        const afterStock = beforeStock + quantity;

        await tx.product.update({
          where: { id: productId },
          data: { stock: afterStock },
        });

        await bumpLocationStock(tx, { productId, locationId: receivingLocationId, delta: quantity });

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
            toLocationId: receivingLocationId,
          },
        });

        if (it.product?.isAssetTracked) {
          const unitsForProduct = preparedUnits.units.filter((u) => u.productId === productId);
          for (const unit of unitsForProduct) {
            await tx.unit.create({
              data: {
                ownershipType: "OWNED",
                productId,
                brand: unit.brand,
                model: unit.model,
                manufacturerSerial: unit.manufacturerSerial,
                tagCode: unit.tagCode,
                uniqueSerialKey: unit.uniqueSerialKey,
                status: "AVAILABLE",
                currentLocationId: receivingLocationId,
              },
            });
          }
        }
      }

      await tx.purchaseBill.update({
        where: { id: bill.id },
        data: { status: "ISSUED", issuedAt: new Date() },
      });

      return { id: bill.id, billNo: bill.billNo };
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to issue";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
