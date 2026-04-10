import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardToken } from "@/lib/dashboard-auth";
import { cancelWalletChange } from "@/lib/fee-config";

export async function POST(req: NextRequest) {
  if (!verifyDashboardToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { caller_address } = await req.json();

    if (!caller_address) {
      return NextResponse.json({ error: "caller_address is required" }, { status: 400 });
    }

    const result = cancelWalletChange(caller_address);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "Pending wallet change cancelled." });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to cancel wallet change";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
