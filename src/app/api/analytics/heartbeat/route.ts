import { NextResponse } from "next/server";
import { resolveOrCreateVisitor } from "@/lib/analytics/visitor";
import { applyHeartbeat } from "@/lib/analytics/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      session_id?: string;
    };
    if (!body.session_id) {
      return NextResponse.json(
        { success: false, error: "MISSING_SESSION" },
        { status: 400 }
      );
    }
    const visitor = await resolveOrCreateVisitor(request);
    const result = await applyHeartbeat({
      visitorId: visitor.visitorId,
      sessionId: body.session_id,
    });
    const res = NextResponse.json(
      {
        success: result.ok,
        active_seconds: result.activeSeconds,
        reason: result.reason,
      },
      { status: result.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } }
    );
    if (visitor.setCookie) res.headers.append("Set-Cookie", visitor.setCookie);
    return res;
  } catch (e) {
    console.error("analytics heartbeat", e);
    return NextResponse.json(
      { success: false, error: "HEARTBEAT_FAILED" },
      { status: 500 }
    );
  }
}
