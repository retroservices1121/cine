import { NextRequest, NextResponse } from "next/server";
import { prepareTrade, listPositions } from "@/lib/spredd";
import { calculateFeeTxs } from "@/lib/fees";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await prepareTrade(body);

    // If this is a sell, check profitability and append fee transactions
    if (body.side === "sell" && body.wallet_address) {
      try {
        const positions = await listPositions({
          wallet_address: body.wallet_address,
          platform: body.platform,
          status: "open",
        });

        const position = positions.find(
          (p) =>
            p.market_id === body.market_id && p.outcome === body.outcome
        );

        if (position) {
          const currentPrice = result.quote?.price_per_token ?? position.current_price;
          const profitPerShare = currentPrice - position.avg_entry_price;

          if (profitPerShare > 0) {
            // Estimate shares being sold based on the amount / current price
            const sharesSold = body.amount / currentPrice;
            const totalProfit = profitPerShare * sharesSold;

            const feeTxs = calculateFeeTxs(totalProfit);
            if (feeTxs.length > 0) {
              result.transactions.push(...feeTxs);
            }
          }
        }
      } catch {
        // If position lookup fails, skip fees rather than blocking the trade
      }
    }

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to prepare trade";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
