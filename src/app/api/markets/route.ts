import { NextRequest, NextResponse } from "next/server";
import { listMarkets } from "@/lib/spredd";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const params: Record<string, string | number | boolean | undefined> = {};
    for (const [k, v] of sp.entries()) params[k] = v;
    if (!params.active) params.active = "true";
    const markets = await listMarkets(params);
    return NextResponse.json(markets);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch markets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
