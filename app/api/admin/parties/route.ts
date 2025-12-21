import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const PARTY_TYPES = ["CUSTOMER", "SUPPLIER", "BOTH"] as const;
type PartyType = (typeof PARTY_TYPES)[number];

function normalizeTags(input: unknown): string[] {
  const raw: string[] = Array.isArray(input)
    ? input.map((v) => String(v))
    : typeof input === "string"
      ? input
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

  // de-dupe while preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const tag = String(t).trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const type = (url.searchParams.get("type") ?? "ALL").toUpperCase();

  const typeFilter: PartyType | "ALL" =
    type === "ALL" ? "ALL" : (PARTY_TYPES.includes(type as PartyType) ? (type as PartyType) : "ALL");

  const parties = await db.party.findMany({
    where: {
      isActive: true,
      ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
              // tags is string[] in Postgres; has is exact match, so keep search basic for now.
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(parties);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const typeRaw = String(body.type ?? "").toUpperCase();
    const type = PARTY_TYPES.includes(typeRaw as PartyType) ? (typeRaw as PartyType) : null;
    if (!type) {
      return NextResponse.json({ error: "Invalid party type." }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const phone = body.phone ? String(body.phone).trim() : null;
    const email = body.email ? String(body.email).trim() : null;
    const address = body.address ? String(body.address).trim() : null;
    const companyName = body.companyName ? String(body.companyName).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const tags = normalizeTags(body.tags);

    const created = await db.party.create({
      data: {
        type,
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        companyName: companyName || null,
        notes: notes || null,
        tags,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
