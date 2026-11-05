import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveOrCreateVisitor } from "@/lib/analytics/visitor";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      return NextResponse.json(
        { success: false, error: "NO_TOKEN" },
        { status: 401 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anon) {
      return NextResponse.json(
        { success: false, error: "SERVER_MISCONFIGURED" },
        { status: 503 }
      );
    }

    const authClient = createClient(url, anon, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    const {
      data: { user },
      error,
    } = await authClient.auth.getUser(token);
    if (error || !user?.id) {
      return NextResponse.json(
        { success: false, error: "INVALID_SESSION" },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      session_id?: string;
    };

    const visitor = await resolveOrCreateVisitor(request);
    const admin = getSupabaseServiceClient();
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from("analytics_visitor_accounts")
      .select("id")
      .eq("visitor_id", visitor.visitorId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.id) {
      await admin
        .from("analytics_visitor_accounts")
        .update({ last_linked_at: now })
        .eq("id", existing.id);
    } else {
      await admin.from("analytics_visitor_accounts").insert({
        visitor_id: visitor.visitorId,
        user_id: user.id,
        first_linked_at: now,
        last_linked_at: now,
      });
    }

    if (body.session_id) {
      await admin
        .from("analytics_sessions")
        .update({ user_id: user.id, last_activity_at: now })
        .eq("id", body.session_id)
        .eq("visitor_id", visitor.visitorId)
        .is("ended_at", null);
    }

    await admin
      .from("analytics_visitors")
      .update({ converted_at: now })
      .eq("id", visitor.visitorId)
      .is("converted_at", null);

    const res = NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
    if (visitor.setCookie) res.headers.append("Set-Cookie", visitor.setCookie);
    return res;
  } catch (e) {
    console.error("analytics link-account", e);
    return NextResponse.json(
      { success: false, error: "LINK_FAILED" },
      { status: 500 }
    );
  }
}
