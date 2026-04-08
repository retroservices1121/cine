import { NextRequest, NextResponse } from "next/server";
import { executeTrade } from "@/lib/spredd";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await executeTrade(body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Trade execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
