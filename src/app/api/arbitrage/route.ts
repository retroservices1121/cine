import { NextRequest, NextResponse } from "next/server";
import { getArbitrage } from "@/lib/spredd";

export async function GET(req: NextRequest) {
  try {
    const minSpread = req.nextUrl.searchParams.get("min_spread");
    const data = await getArbitrage(minSpread ? Number(minSpread) : undefined);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch arbitrage";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
