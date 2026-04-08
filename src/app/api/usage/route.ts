import { NextResponse } from "next/server";
import { getUsage } from "@/lib/spredd";

export async function GET() {
  try {
    const data = await getUsage();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch usage";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
