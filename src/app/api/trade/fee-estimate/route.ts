import { NextRequest, NextResponse } from "next/server";
import { calculateFeeSummary } from "@/lib/fees";

export async function GET(req: NextRequest) {
  const amount = Number(req.nextUrl.searchParams.get("amount") || 0);
  const summary = calculateFeeSummary(amount);
  return NextResponse.json(summary || { amount: 0, feePercent: 1, totalFee: 0 });
}
