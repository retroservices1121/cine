import { NextRequest, NextResponse } from "next/server";
import { getPnl } from "@/lib/spredd";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const walletAddress = sp.get("wallet_address");
    if (!walletAddress) {
      return NextResponse.json({ error: "wallet_address required" }, { status: 400 });
    }
    const pnl = await getPnl({
      wallet_address: walletAddress,
      platform: sp.get("platform") || undefined,
      interval: sp.get("interval") || "all",
    });
    return NextResponse.json(pnl);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch PNL";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
