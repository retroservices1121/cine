import { NextRequest, NextResponse } from "next/server";
import { resolveMarket } from "@/lib/spredd";
import { verifyDashboardToken } from "@/lib/dashboard-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractAddress: string }> }
) {
  if (!verifyDashboardToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { contractAddress } = await params;
  try {
    const body = await req.json();
    const result = await resolveMarket(contractAddress, body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to resolve market";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
