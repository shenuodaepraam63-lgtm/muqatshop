import { NextResponse } from "next/server";
import { resolveOrCreateVisitor } from "@/lib/analytics/visitor";
import { getOrCreateSession } from "@/lib/analytics/session";
import { recordEvent } from "@/lib/analytics/events";

export const runtime = "nodejs";

const CLIENT_FORBIDDEN = new Set(["signup", "login", "purchase"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      event_key?: string;
      event_type?: string;
      path?: string;
      product_id?: string;
      category_id?: string;
      session_id?: string;
      metadata?: unknown;
    };

    if (!body.event_key || !body.event_type) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }
    if (CLIENT_FORBIDDEN.has(body.event_type)) {
      return NextResponse.json(
        { success: false, error: "EVENT_SERVER_ONLY" },
        { status: 403 }
      );
    }

    const visitor = await resolveOrCreateVisitor(request);
    let sessionId = body.session_id;
    if (!sessionId) {
      const s = await getOrCreateSession({
        visitorId: visitor.visitorId,
        entryPath: body.path || "/",
      });
      sessionId = s.sessionId;
    }

    const result = await recordEvent({
      visitorId: visitor.visitorId,
      sessionId,
      eventKey: body.event_key,
      eventType: body.event_type,
      path: body.path,
      productId: body.product_id,
      categoryId: body.category_id,
      metadata: body.metadata,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        duplicate: !!result.duplicate,
        session_id: sessionId,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
    if (visitor.setCookie) res.headers.append("Set-Cookie", visitor.setCookie);
    return res;
  } catch (e) {
    console.error("analytics event", e);
    return NextResponse.json(
      { success: false, error: "EVENT_FAILED" },
      { status: 500 }
    );
  }
}
