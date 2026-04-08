import { NextRequest, NextResponse } from "next/server";
import { calculateFeeSummary } from "@/lib/fees";

export async function GET(req: NextRequest) {
  const profit = Number(req.nextUrl.searchParams.get("profit") || 0);
  const summary = calculateFeeSummary(profit);
  return NextResponse.json(summary || { profit: 0, feePercent: 1, totalFee: 0 });
}
