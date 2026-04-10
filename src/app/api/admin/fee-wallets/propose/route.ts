import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardToken } from "@/lib/dashboard-auth";
import { proposeWalletChange } from "@/lib/fee-config";

export async function POST(req: NextRequest) {
  if (!verifyDashboardToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { new_wallet_1, new_wallet_2, proposer_address, signature } = await req.json();

    if (!new_wallet_1 || !new_wallet_2 || !proposer_address || !signature) {
      return NextResponse.json(
        { error: "new_wallet_1, new_wallet_2, proposer_address, and signature are required" },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(new_wallet_1) || !/^0x[a-fA-F0-9]{40}$/.test(new_wallet_2)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
    }

    const result = proposeWalletChange(new_wallet_1, new_wallet_2, proposer_address, signature);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "Wallet change proposed. Awaiting approval from the other wallet." });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to propose wallet change";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
