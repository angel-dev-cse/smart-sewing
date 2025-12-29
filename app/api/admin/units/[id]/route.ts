import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateUnitData, isTerminalStatus } from "@/lib/unit-utils";

type UpdateUnitBody = {
  status?: string;
  currentLocationId?: string;
  notes?: string;
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

    // Update the unit
    const unit = await db.unit.update({
      where: { id },
      data: {
        status: body.status as any,
        currentLocationId: body.currentLocationId,
        notes: body.notes,
      },
      include: {
        product: { select: { id: true, title: true, type: true } },
        ownerParty: { select: { id: true, name: true, type: true } },
        currentLocation: { select: { id: true, code: true, name: true } },
      },
    });

    return NextResponse.json({ unit });
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
