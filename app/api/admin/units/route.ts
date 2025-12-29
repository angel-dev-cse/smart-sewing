import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateUnitData } from "@/lib/unit-utils";

type CreateUnitBody = {
  ownershipType: 'OWNED' | 'CUSTOMER_OWNED' | 'RENTED_IN';
  productId?: string;
  brand: string;
  model: string;
  manufacturerSerial?: string;
  tagCode?: string;
  ownerPartyId?: string;
  currentLocationId?: string;
  notes?: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ownershipType = url.searchParams.get('ownershipType');
    const status = url.searchParams.get('status');
    const locationId = url.searchParams.get('locationId');
    const productId = url.searchParams.get('productId');
    const search = url.searchParams.get('search'); // for serial/tag/brand/model search

    const where: any = {};

    if (ownershipType) where.ownershipType = ownershipType;
    if (status) where.status = status;
    if (locationId) where.currentLocationId = locationId;
    if (productId) where.productId = productId;

    if (search) {
      where.OR = [
        { manufacturerSerial: { contains: search, mode: 'insensitive' } },
        { tagCode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { uniqueSerialKey: { contains: search, mode: 'insensitive' } },
      ];
    }

    const units = await db.unit.findMany({
      where,
      include: {
        product: { select: { id: true, title: true, type: true, isAssetTracked: true, serialRequired: true } },
        ownerParty: { select: { id: true, name: true, type: true } },
        currentLocation: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ units });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateUnitBody;

    // Get product info if provided
    let productSerialRequired = false;
    if (body.productId) {
      const product = await db.product.findUnique({
        where: { id: body.productId },
        select: { isAssetTracked: true, serialRequired: true }
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 400 });
      }

      if (!product.isAssetTracked) {
        return NextResponse.json({ error: "Product is not asset-tracked" }, { status: 400 });
      }

      productSerialRequired = product.serialRequired;
    }

    // Validate unit data
    const validation = validateUnitData({
      ownershipType: body.ownershipType,
      productId: body.productId,
      brand: body.brand,
      model: body.model,
      manufacturerSerial: body.manufacturerSerial,
      tagCode: body.tagCode,
      ownerPartyId: body.ownerPartyId,
      productSerialRequired,
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check for duplicate unique serial key
    if (validation.uniqueSerialKey) {
      const existing = await db.unit.findUnique({
        where: { uniqueSerialKey: validation.uniqueSerialKey },
      });

      if (existing) {
        return NextResponse.json({
          error: "Unit with this serial number already exists",
          existingUnitId: existing.id
        }, { status: 400 });
      }
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

    // Validate owner party exists if provided
    if (body.ownerPartyId) {
      const party = await db.party.findUnique({
        where: { id: body.ownerPartyId },
        select: { id: true, isActive: true }
      });

      if (!party || !party.isActive) {
        return NextResponse.json({ error: "Invalid or inactive party" }, { status: 400 });
      }
    }

    // Create the unit
    const unit = await db.unit.create({
      data: {
        ownershipType: body.ownershipType,
        productId: body.productId,
        brand: body.brand,
        model: body.model,
        manufacturerSerial: body.manufacturerSerial,
        tagCode: body.tagCode,
        uniqueSerialKey: validation.uniqueSerialKey,
        ownerPartyId: body.ownerPartyId,
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
