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

      if (contract.status !== "ACTIVE") {
        return {
          ok: false as const,
          status: 400 as const,
          error: "Only ACTIVE contracts can be closed.",
        };
      }

      // Return stock + write movements
      for (const it of contract.items) {
        const p = await tx.product.findUnique({
          where: { id: it.productId },
          select: { stock: true },
        });

        if (!p) continue;

        const beforeStock = p.stock;
        const afterStock = beforeStock + it.quantity;

        await tx.product.update({
          where: { id: it.productId },
          data: { stock: afterStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: it.productId,
            kind: "IN",
            quantity: it.quantity,
            beforeStock,
            afterStock,
            refType: "RENTAL_CONTRACT_RETURN",
            refId: contract.id,
            note: `Returned (contract #${contract.contractNo})`,
          },
        });
      }

      await tx.rentalContract.update({
        where: { id: contract.id },
        data: { status: "CLOSED", endDate: new Date() },
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
