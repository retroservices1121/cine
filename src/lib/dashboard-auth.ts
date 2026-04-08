import { NextRequest } from "next/server";

export function verifyDashboardToken(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const expected = Buffer.from(
    `${process.env.DASHBOARD_PASSWORD || ""}:${process.env.SPREDD_API_KEY || ""}`
  ).toString("base64");
  return token === expected;
}
