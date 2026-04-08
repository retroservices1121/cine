import { NextRequest, NextResponse } from "next/server";
import { claimWinnings } from "@/lib/spredd";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractAddress: string }> }
) {
  const { contractAddress } = await params;
  try {
    const body = await req.json();
    const result = await claimWinnings(contractAddress, body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to claim winnings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
