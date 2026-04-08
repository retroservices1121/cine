import { NextRequest, NextResponse } from "next/server";
import { redeemPosition } from "@/lib/spredd";
import { calculateFeeTxs } from "@/lib/fees";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await redeemPosition(body);

    // Calculate fee on winnings and return fee transactions for client-side signing
    let feeTxs: ReturnType<typeof calculateFeeTxs> = [];
    if (result.payout_amount > 0) {
      feeTxs = calculateFeeTxs(result.payout_amount);
    }

    return NextResponse.json({
      ...result,
      fee_transactions: feeTxs,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Redemption failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
