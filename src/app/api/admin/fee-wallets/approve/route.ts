import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardToken } from "@/lib/dashboard-auth";
import { approveWalletChange } from "@/lib/fee-config";

export async function POST(req: NextRequest) {
  if (!verifyDashboardToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { approver_address, signature } = await req.json();

    if (!approver_address || !signature) {
      return NextResponse.json(
        { error: "approver_address and signature are required" },
        { status: 400 }
      );
    }

    const result = approveWalletChange(approver_address, signature);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "Wallet change approved and applied." });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to approve wallet change";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
