import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const bill = await db.rentalBill.findUnique({ where: { id }, select: { status: true } });
    if (!bill) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (bill.status !== "DRAFT") return NextResponse.json({ error: "Only DRAFT bills can be issued." }, { status: 400 });

    await db.rentalBill.update({
      where: { id },
      data: { status: "ISSUED", issuedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
