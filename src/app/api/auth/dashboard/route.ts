import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.DASHBOARD_PASSWORD;
  if (!correct) {
    return NextResponse.json({ error: "Dashboard password not configured" }, { status: 500 });
  }
  if (password !== correct) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  // Return a token (simple hash of password + secret) for subsequent API calls
  const token = Buffer.from(`${correct}:${process.env.SPREDD_API_KEY || ""}`).toString("base64");
  return NextResponse.json({ token });
}
