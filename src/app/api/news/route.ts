import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/spredd";

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") || 20);
    const data = await getNews(limit);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch news";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
