import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name || !body.type) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const party = await db.party.create({
    data: {
      name: body.name,
      type: body.type,
      phone: body.phone ?? null,
    },
  });

  return NextResponse.json(party);
}
