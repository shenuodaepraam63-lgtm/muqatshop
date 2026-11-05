import { NextResponse } from "next/server";
import { resolveOrCreateVisitor } from "@/lib/analytics/visitor";
import { getOrCreateSession } from "@/lib/analytics/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      entry_path?: string;
    };
    const visitor = await resolveOrCreateVisitor(request);
    const session = await getOrCreateSession({
      visitorId: visitor.visitorId,
      entryPath: body.entry_path || "/",
    });
    const res = NextResponse.json(
      {
        success: true,
        session_id: session.sessionId,
        created: session.created,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
    if (visitor.setCookie) res.headers.append("Set-Cookie", visitor.setCookie);
    return res;
  } catch (e) {
    console.error("analytics session", e);
    return NextResponse.json(
      { success: false, error: "SESSION_FAILED" },
      { status: 500 }
    );
  }
}
