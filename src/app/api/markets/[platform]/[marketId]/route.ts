import { NextRequest, NextResponse } from "next/server";
import { getMarket, getOrderBook, getPriceHistory } from "@/lib/spredd";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string; marketId: string }> }
) {
  const { platform, marketId } = await params;
  const include = req.nextUrl.searchParams.get("include") || "";

  try {
    const market = await getMarket(platform, marketId);

    let orderbook = null;
    let priceHistory = null;

    if (include.includes("orderbook")) {
      orderbook = await getOrderBook(platform, marketId).catch(() => null);
    }
    if (include.includes("history")) {
      const interval = req.nextUrl.searchParams.get("interval") || "1d";
      priceHistory = await getPriceHistory(platform, marketId, interval).catch(() => null);
    }

    return NextResponse.json({ market, orderbook, priceHistory });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch market";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
