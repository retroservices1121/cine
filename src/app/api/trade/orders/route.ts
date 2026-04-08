import { NextRequest, NextResponse } from "next/server";
import { createOrder, listOrders } from "@/lib/spredd";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const params: Record<string, string | undefined> = {};
    for (const [k, v] of sp.entries()) params[k] = v;
    const orders = await listOrders(params);
    return NextResponse.json(orders);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch orders";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order = await createOrder(body);
    return NextResponse.json(order);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
