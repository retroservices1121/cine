import { NextRequest, NextResponse } from "next/server";
import { getPriceHistory } from "@/lib/spredd";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string; marketId: string }> }
) {
  const { platform, marketId } = await params;
  const interval = req.nextUrl.searchParams.get("interval") || "1h";
  try {
    const data = await getPriceHistory(platform, marketId, interval);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch price history";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
