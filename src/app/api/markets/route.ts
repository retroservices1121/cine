import { NextRequest, NextResponse } from "next/server";
import { listMarkets } from "@/lib/spredd";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const markets = await listMarkets({
      platform: sp.get("platform") || undefined,
      search: sp.get("search") || undefined,
      category: sp.get("category") || undefined,
      active: sp.has("active") ? sp.get("active") === "true" : true,
      limit: Number(sp.get("limit") || 20),
      offset: Number(sp.get("offset") || 0),
      sort: sp.get("sort") || "volume",
    });
    return NextResponse.json(markets);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch markets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
