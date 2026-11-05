import { NextResponse } from "next/server";
import { resolveOrCreateVisitor } from "@/lib/analytics/visitor";
import { endSession } from "@/lib/analytics/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      session_id?: string;
      exit_path?: string;
    };
    if (!body.session_id) {
      return NextResponse.json(
        { success: false, error: "MISSING_SESSION" },
        { status: 400 }
      );
    }
    const visitor = await resolveOrCreateVisitor(request);
    await endSession({
      visitorId: visitor.visitorId,
      sessionId: body.session_id,
      exitPath: body.exit_path,
    });
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("analytics end-session", e);
    return NextResponse.json(
      { success: false, error: "END_FAILED" },
      { status: 500 }
    );
  }
}
