import { NextRequest, NextResponse } from "next/server";
import { listPositions, getPnl } from "@/lib/spredd";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const walletAddress = sp.get("wallet_address");
    if (!walletAddress) {
      return NextResponse.json({ error: "wallet_address required" }, { status: 400 });
    }

    const include = sp.get("include") || "";

    const positions = await listPositions({
      wallet_address: walletAddress,
      platform: sp.get("platform") || undefined,
      status: sp.get("status") || undefined,
      limit: Number(sp.get("limit") || 50),
    });

    let pnl = null;
    if (include.includes("pnl")) {
      pnl = await getPnl({
        wallet_address: walletAddress,
        interval: sp.get("interval") || "all",
      }).catch(() => null);
    }

    return NextResponse.json({ positions, pnl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch positions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
