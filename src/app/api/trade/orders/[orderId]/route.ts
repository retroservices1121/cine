import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/lib/spredd";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const result = await cancelOrder(orderId);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to cancel order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
