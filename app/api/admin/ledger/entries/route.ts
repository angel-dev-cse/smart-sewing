import { db } from "@/lib/db";
import { parseBdtToPaisa } from "@/lib/money";
import { NextResponse } from "next/server";

const ALLOWED_DIR = ["IN", "OUT"] as const;
type Dir = (typeof ALLOWED_DIR)[number];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const accountId = String(body.accountId ?? "").trim();
    const categoryId = body.categoryId ? String(body.categoryId).trim() : null;
    const direction = String(body.direction ?? "").toUpperCase() as Dir;
    const amount = parseBdtToPaisa(body.amount, { allowZero: false, minPaisa: 1 });
    const note = body.note ? String(body.note).trim() : null;

    const occurredAtRaw = body.occurredAt ? String(body.occurredAt) : null;
    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();

    const refType = body.refType ? String(body.refType).trim() : null;
    const refId = body.refId ? String(body.refId).trim() : null;

    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId." }, { status: 400 });
    }
    if (!ALLOWED_DIR.includes(direction)) {
      return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
    }
    if (!amount) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }
    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "Invalid occurredAt date." }, { status: 400 });
    }

    // Ensure account exists (and optionally category)
    const [acc, cat] = await Promise.all([
      db.ledgerAccount.findUnique({ where: { id: accountId }, select: { id: true } }),
      categoryId
        ? db.ledgerCategory.findUnique({ where: { id: categoryId }, select: { id: true } })
        : Promise.resolve(null),
    ]);

    if (!acc) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    if (categoryId && !cat) return NextResponse.json({ error: "Category not found." }, { status: 404 });

    const entry = await db.ledgerEntry.create({
      data: {
        accountId,
        categoryId,
        direction,
        amount,
        note,
        occurredAt,
        refType,
        refId,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: entry.id });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
