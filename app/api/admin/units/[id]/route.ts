import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateUnitData, isTerminalStatus, computeUniqueSerialKey } from "@/lib/unit-utils";

type UpdateUnitBody = {
  status?: string;
  currentLocationId?: string;
  notes?: string;
  // Phase 8D.2.1: Identity field updates (Admin + Approved editor only)
  brand?: string;
  model?: string;
  manufacturerSerial?: string;
  tagCode?: string;
  changeReason?: string; // Required when updating identity fields
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET({ params }: Props) {
  try {
    const { id } = await params;

    const unit = await db.unit.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true, type: true, isAssetTracked: true, serialRequired: true } },
        ownerParty: { select: { id: true, name: true, type: true, phone: true, address: true } },
        currentLocation: { select: { id: true, code: true, name: true } },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    return NextResponse.json({ unit });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateUnitBody;

    // Get current unit
    const currentUnit = await db.unit.findUnique({
      where: { id },
      include: {
        product: { select: { serialRequired: true } }
      }
    });

    if (!currentUnit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Prevent changes to terminal status units (except admin override)
    if (isTerminalStatus(currentUnit.status) && body.status && body.status !== currentUnit.status) {
      return NextResponse.json({
        error: "Cannot change status of terminal units",
        currentStatus: currentUnit.status
      }, { status: 400 });
    }

    // Phase 8D.2.1: Check if identity fields are being updated
    const identityFields = ['brand', 'model', 'manufacturerSerial', 'tagCode'];
    const isIdentityUpdate = identityFields.some(field => body[field as keyof UpdateUnitBody] !== undefined);

    if (isIdentityUpdate) {
      // Require change reason for identity field updates
      if (!body.changeReason || body.changeReason.trim().length === 0) {
        return NextResponse.json({
          error: "Change reason is required when updating identity fields (brand, model, serial, or tag)",
          code: "IDENTITY_CHANGE_REASON_REQUIRED"
        }, { status: 400 });
      }

      // TODO: Add permission check for Admin + Approved editor when user auth is implemented
      // For now, allow the update but log that permissions should be checked
    }

    // Validate location exists if provided
    if (body.currentLocationId) {
      const location = await db.location.findUnique({
        where: { id: body.currentLocationId },
        select: { id: true, isActive: true }
      });

      if (!location || !location.isActive) {
        return NextResponse.json({ error: "Invalid or inactive location" }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      status: body.status as any,
      currentLocationId: body.currentLocationId,
      notes: body.notes,
    };

    // Handle identity field updates
    let newUniqueSerialKey: string | undefined;
    if (isIdentityUpdate) {
      // Compute new unique serial key if manufacturer serial is being updated
      if (body.manufacturerSerial !== undefined) {
        if (body.manufacturerSerial && body.manufacturerSerial.trim()) {
          newUniqueSerialKey = computeUniqueSerialKey(
            body.brand || currentUnit.brand,
            body.model || currentUnit.model,
            body.manufacturerSerial.trim()
          );
        } else {
          // If manufacturer serial is being cleared, uniqueSerialKey should also be cleared
          newUniqueSerialKey = null;
        }
      }

      // Apply identity field updates
      if (body.brand !== undefined) updateData.brand = body.brand;
      if (body.model !== undefined) updateData.model = body.model;
      if (body.manufacturerSerial !== undefined) updateData.manufacturerSerial = body.manufacturerSerial;
      if (body.tagCode !== undefined) updateData.tagCode = body.tagCode;
      if (newUniqueSerialKey !== undefined) updateData.uniqueSerialKey = newUniqueSerialKey;
    }

    // Execute update in transaction to ensure revision tracking
    const result = await db.$transaction(async (tx) => {
      // Create identity revision if identity fields changed
      if (isIdentityUpdate) {
        await tx.unitIdentityRevision.create({
          data: {
            unitId: id,
            oldBrand: currentUnit.brand,
            oldModel: currentUnit.model,
            oldManufacturerSerial: currentUnit.manufacturerSerial,
            oldTagCode: currentUnit.tagCode,
            oldUniqueSerialKey: currentUnit.uniqueSerialKey,
            newBrand: body.brand,
            newModel: body.model,
            newManufacturerSerial: body.manufacturerSerial,
            newTagCode: body.tagCode,
            newUniqueSerialKey: newUniqueSerialKey,
            changeReason: body.changeReason!,
            // performedByUserId: // TODO: Add when user auth is implemented
          }
        });
      }

      // Update the unit
      const unit = await tx.unit.update({
        where: { id },
        data: updateData,
        include: {
          product: { select: { id: true, title: true, type: true, isAssetTracked: true, serialRequired: true } },
          ownerParty: { select: { id: true, name: true, type: true } },
          currentLocation: { select: { id: true, code: true, name: true } },
        },
      });

      return unit;
    });

    return NextResponse.json({ unit: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: Props) {
  try {
    const { id } = await params;

    // Get current unit to check if it can be deleted
    const unit = await db.unit.findUnique({
      where: { id },
      select: { status: true, ownershipType: true }
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Prevent deletion of units that are in use (future: check for document references)
    // For now, allow deletion but log it as a safety measure

    await db.unit.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
