import { NextResponse } from "next/server";
import { resolveOrCreateVisitor } from "@/lib/analytics/visitor";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const resolved = await resolveOrCreateVisitor(request);
    const res = NextResponse.json(
      { success: true, identified: true },
      { headers: { "Cache-Control": "no-store" } }
    );
    if (resolved.setCookie) {
      res.headers.append("Set-Cookie", resolved.setCookie);
    }
    return res;
  } catch (e) {
    console.error("analytics identify", e);
    return NextResponse.json(
      { success: false, error: "IDENTIFY_FAILED" },
      { status: 500 }
    );
  }
}
