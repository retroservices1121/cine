import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/spredd";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const quote = await getQuote(body);
    return NextResponse.json(quote);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to get quote";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
