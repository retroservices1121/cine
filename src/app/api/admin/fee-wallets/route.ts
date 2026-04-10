import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardToken } from "@/lib/dashboard-auth";
import { getFeeWalletConfig } from "@/lib/fee-config";

export async function GET(req: NextRequest) {
  if (!verifyDashboardToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getFeeWalletConfig();
  if (!config) {
    return NextResponse.json({ error: "No fee wallets configured" }, { status: 404 });
  }

  return NextResponse.json(config);
}
