import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        price: true,
        stock: true,
        isActive: true,
        isAssetTracked: true,
        serialRequired: true,
        brand: true,
        model: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ products });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

type CreateProductBody = {
  title: string;
  type: 'MACHINE_SALE' | 'MACHINE_RENT' | 'PART';
  price: number;
  stock?: number;
  isActive?: boolean;
  isAssetTracked?: boolean;
  serialRequired?: boolean;
  brand?: string;
  model?: string;
  description?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateProductBody;

    // Validate required fields
    if (!body.title || !body.type || body.price === undefined) {
      return NextResponse.json({ error: "Title, type, and price are required" }, { status: 400 });
    }

    if (body.price < 0) {
      return NextResponse.json({ error: "Price must be non-negative" }, { status: 400 });
    }

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug is unique
    const existing = await db.product.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (existing) {
      return NextResponse.json({ error: "A product with this title already exists" }, { status: 400 });
    }

    // Create the product
    const product = await db.product.create({
      data: {
        title: body.title,
        slug,
        type: body.type,
        price: Math.round(body.price * 100), // Convert to integer (BDT paisa)
        stock: body.stock || 0,
        isActive: body.isActive ?? true,
        isAssetTracked: body.isAssetTracked ?? false,
        serialRequired: body.serialRequired ?? false,
        brand: body.brand || null,
        model: body.model || null,
        description: body.description || null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        price: true,
        stock: true,
        isActive: true,
        isAssetTracked: true,
        serialRequired: true,
        brand: true,
        model: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ product });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
