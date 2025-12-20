import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing rental contract id." }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const contract = await tx.rentalContract.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!contract) {
        return { ok: false as const, status: 404 as const, error: "Contract not found." };
      }

      if (contract.status !== "DRAFT") {
        return {
          ok: false as const,
          status: 400 as const,
          error: "Only DRAFT contracts can be activated.",
        };
      }

      // Stock checks inside transaction
      for (const it of contract.items) {
        const p = await tx.product.findUnique({
          where: { id: it.productId },
          select: { stock: true, title: true },
        });

        if (!p) {
          return {
            ok: false as const,
            status: 400 as const,
            error: "A product in this contract no longer exists.",
          };
        }

        if (it.quantity > p.stock) {
          return {
            ok: false as const,
            status: 400 as const,
            error: `Not enough stock for ${p.title}.`,
          };
        }
      }

      // Decrement stock + write movements
      for (const it of contract.items) {
        const p = await tx.product.findUnique({
          where: { id: it.productId },
          select: { stock: true },
        });

        if (!p) continue;

        const beforeStock = p.stock;
        const afterStock = beforeStock - it.quantity;

        await tx.product.update({
          where: { id: it.productId },
          data: { stock: afterStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: it.productId,
            kind: "OUT",
            quantity: it.quantity,
            beforeStock,
            afterStock,
            refType: "RENTAL_CONTRACT",
            refId: contract.id,
            note: `Rented out (contract #${contract.contractNo})`,
          },
        });
      }

      await tx.rentalContract.update({
        where: { id: contract.id },
        data: { status: "ACTIVE" },
      });

      return { ok: true as const, status: 200 as const };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
