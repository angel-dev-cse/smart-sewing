import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateTagCode, computeUniqueSerialKey } from "@/lib/unit-utils";

type UnitIdentity = {
  manufacturerSerial: string | null;
};

type UnitizeRequest = {
  productId: string;
  locationId: string;
  count: number;
  reasonNote: string;
  unitIdentities: UnitIdentity[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as UnitizeRequest;

    const { productId, locationId, count, reasonNote, unitIdentities } = body;

    // Validate inputs
    if (!productId || !locationId || count <= 0) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    if (count > 1000) {
      return NextResponse.json({ error: "Cannot create more than 1000 units at once" }, { status: 400 });
    }

    if (!unitIdentities || unitIdentities.length !== count) {
      return NextResponse.json({ error: "Unit identities array must match the count" }, { status: 400 });
    }

    // Validate product exists and is asset-tracked
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        type: true,
        brand: true,
        model: true,
        isAssetTracked: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.isAssetTracked) {
      return NextResponse.json({ error: "Product is not asset-tracked" }, { status: 400 });
    }

    if (!product.brand || !product.model) {
      return NextResponse.json({
        error: "Product must have brand and model for unitization"
      }, { status: 400 });
    }

    // Validate location exists
    const location = await db.location.findUnique({
      where: { id: locationId },
      select: { id: true, code: true, name: true }
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Check current stock and unit counts
    const locationStock = await db.locationStock.findUnique({
      where: {
        locationId_productId: {
          locationId,
          productId
        }
      },
      select: { quantity: true }
    });

    const stockQty = locationStock?.quantity || 0;

    const unitCount = await db.unit.count({
      where: {
        productId,
        currentLocationId: locationId,
        ownershipType: 'OWNED',
        status: {
          in: ['AVAILABLE', 'IN_SERVICE', 'RENTED_OUT', 'IDLE_AT_CUSTOMER']
        }
      }
    });

    const unitsNeeded = Math.max(0, stockQty - unitCount);

    if (count > unitsNeeded) {
      return NextResponse.json({
        error: `Cannot create ${count} units. Only ${unitsNeeded} units needed (stock: ${stockQty}, existing units: ${unitCount})`
      }, { status: 400 });
    }

    // Execute unitization in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create unitization batch record
      const batch = await tx.unitizationBatch.create({
        data: {
          productId,
          locationId,
          countCreated: count,
          reasonNote: reasonNote || null,
          // performedByUserId will be added when user auth is implemented
        },
        select: { id: true }
      });

      // Create units with proper identity handling
      const createdUnits = [];
      for (let i = 0; i < count; i++) {
        const identity = unitIdentities[i];
        let tagCode: string;
        let manufacturerSerial: string | null = null;
        let uniqueSerialKey: string;

        if (identity.manufacturerSerial && identity.manufacturerSerial.trim()) {
          // Use manufacturer serial - compute unique key and generate shop tag
          manufacturerSerial = identity.manufacturerSerial.trim();
          uniqueSerialKey = computeUniqueSerialKey(product.brand!, product.model!, manufacturerSerial);
          tagCode = await generateTagCode(tx, product.type === 'MACHINE_SALE' ? 'M' : 'P');
        } else {
          // No manufacturer serial - generate shop tag and use as unique key
          tagCode = await generateTagCode(tx, product.type === 'MACHINE_SALE' ? 'M' : 'P');
          uniqueSerialKey = tagCode;
        }

        const unitData = {
          ownershipType: 'OWNED' as const,
          productId,
          manufacturerSerial,
          brand: product.brand!,
          model: product.model!,
          uniqueSerialKey,
          tagCode,
          status: 'AVAILABLE' as const,
          currentLocationId: locationId,
          unitizationBatchId: batch.id,
          notes: `Unitized from existing stock - ${reasonNote || 'Go-live unitization'}`
        };

        const unit = await tx.unit.create({
          data: unitData,
          select: { id: true }
        });
        createdUnits.push(unit);
      }

      return {
        batch,
        createdUnits,
        countCreated: createdUnits.length
      };
    });

    return NextResponse.json({
      success: true,
      countCreated: result.countCreated,
      batchId: result.batch.id,
      productTitle: product.title,
      locationCode: location.code
    });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to unitize stock";
    console.error('Unitization error:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
