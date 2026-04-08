import { NextRequest, NextResponse } from "next/server";
import { prepareTrade } from "@/lib/spredd";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prepared = await prepareTrade(body);
    return NextResponse.json(prepared);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to prepare trade";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
