import { NextRequest, NextResponse } from "next/server";
import { createMarket } from "@/lib/spredd";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createMarket(body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create market";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
