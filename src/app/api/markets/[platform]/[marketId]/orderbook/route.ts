import { NextRequest, NextResponse } from "next/server";
import { getOrderBook } from "@/lib/spredd";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string; marketId: string }> }
) {
  const { platform, marketId } = await params;
  const outcome = req.nextUrl.searchParams.get("outcome") || "yes";
  try {
    const ob = await getOrderBook(platform, marketId, outcome);
    return NextResponse.json(ob);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch orderbook";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
