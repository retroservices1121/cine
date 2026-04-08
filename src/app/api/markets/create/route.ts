import { NextRequest, NextResponse } from "next/server";
import { prepareCreateMarket } from "@/lib/spredd";
import { verifyDashboardToken } from "@/lib/dashboard-auth";

export async function POST(req: NextRequest) {
  if (!verifyDashboardToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const result = await prepareCreateMarket(body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to prepare market creation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
