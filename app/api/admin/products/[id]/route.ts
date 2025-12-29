import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET({ params }: Props) {
  try {
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
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

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

type UpdateProductBody = {
  title?: string;
  type?: 'MACHINE_SALE' | 'MACHINE_RENT' | 'PART';
  price?: number;
  stock?: number;
  isActive?: boolean;
  isAssetTracked?: boolean;
  serialRequired?: boolean;
  brand?: string;
  model?: string;
  description?: string;
};

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateProductBody;

    // Get current product
    const currentProduct = await db.product.findUnique({
      where: { id },
      select: { title: true, slug: true }
    });

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Validate price if provided
    if (body.price !== undefined && (body.price < 0 || !Number.isFinite(body.price))) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }

    // Validate stock if provided
    if (body.stock !== undefined && (body.stock < 0 || !Number.isInteger(body.stock))) {
      return NextResponse.json({ error: "Stock must be a non-negative integer" }, { status: 400 });
    }

    // Get current product for validation
    const currentProductForValidation = await db.product.findUnique({
      where: { id },
      select: { isAssetTracked: true, brand: true, model: true }
    });

    // Determine final isAssetTracked value (use provided value or current)
    const finalIsAssetTracked = body.isAssetTracked !== undefined ? body.isAssetTracked : currentProductForValidation?.isAssetTracked;

    // Guardrails: if isAssetTracked=true, brand+model required
    if (finalIsAssetTracked) {
      const finalBrand = body.brand !== undefined ? body.brand : currentProductForValidation?.brand;
      const finalModel = body.model !== undefined ? body.model : currentProductForValidation?.model;

      if (!finalBrand || !finalModel) {
        return NextResponse.json({
          error: "Brand and model are required for asset-tracked products"
        }, { status: 400 });
      }
    }

    // Handle title change (regenerate slug)
    let slug = currentProduct.slug;
    if (body.title && body.title !== currentProduct.title) {
      slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if new slug conflicts with other products
      const existing = await db.product.findFirst({
        where: {
          slug,
          id: { not: id }
        },
        select: { id: true }
      });

      if (existing) {
        return NextResponse.json({ error: "A product with this title already exists" }, { status: 400 });
      }
    }

    // Update the product
    const product = await db.product.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title, slug }),
        ...(body.type && { type: body.type }),
        ...(body.price !== undefined && { price: Math.round(body.price * 100) }), // Convert to integer
        ...(body.stock !== undefined && { stock: body.stock }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isAssetTracked !== undefined && { isAssetTracked: body.isAssetTracked }),
        ...(body.serialRequired !== undefined && { serialRequired: body.serialRequired }),
        ...(body.brand !== undefined && { brand: body.brand || null }),
        ...(body.model !== undefined && { model: body.model || null }),
        ...(body.description !== undefined && { description: body.description || null }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
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

    return NextResponse.json({ product });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: Props) {
  try {
    const { id } = await params;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id },
      select: { id: true, title: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check for related records that would prevent deletion
    const [salesInvoices, purchaseBills, units] = await Promise.all([
      db.salesInvoiceItem.count({ where: { productId: id } }),
      db.purchaseBillItem.count({ where: { productId: id } }),
      db.unit.count({ where: { productId: id } })
    ]);

    if (salesInvoices > 0 || purchaseBills > 0 || units > 0) {
      return NextResponse.json({
        error: "Cannot delete product that has been used in transactions or has associated units"
      }, { status: 400 });
    }

    // Delete the product
    await db.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
