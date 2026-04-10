import { NextRequest, NextResponse } from "next/server";
import { prepareTrade } from "@/lib/spredd";
import { calculateFeeTxs } from "@/lib/fees";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await prepareTrade(body);

    // Append 1% fee transactions on every trade (buy or sell)
    if (body.amount > 0) {
      const feeTxs = calculateFeeTxs(body.amount);
      if (feeTxs.length > 0) {
        result.transactions.push(...feeTxs);
      }
    }

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to prepare trade";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
