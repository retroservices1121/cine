import { NextRequest, NextResponse } from "next/server";
import { createMarket } from "@/lib/spredd";
import { verifyDashboardToken } from "@/lib/dashboard-auth";

export async function POST(req: NextRequest) {
  if (!verifyDashboardToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const deployKey = process.env.DEPLOY_PRIVATE_KEY;
  if (!deployKey) {
    return NextResponse.json({ error: "DEPLOY_PRIVATE_KEY not configured" }, { status: 500 });
  }
  try {
    const body = await req.json();
    const result = await createMarket({
      ...body,
      private_key: deployKey,
    });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create market";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
