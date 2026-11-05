import { NextResponse } from "next/server";
import { isAdminAuthSuccess, requireAdmin } from "@/lib/admin-auth";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!isAdminAuthSuccess(auth)) return auth;

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const admin = getSupabaseServiceClient();

  const fromIso = from
    ? new Date(from).toISOString()
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const toIso = to ? new Date(to).toISOString() : new Date().toISOString();

  const [{ count: visitorsTotal }, { data: sessions }, { data: pageEvents }, { data: productEvents }, { data: newVisitors }] =
    await Promise.all([
      admin
        .from("analytics_visitors")
        .select("id", { count: "exact", head: true })
        .gte("last_seen_at", fromIso)
        .lte("last_seen_at", toIso),
      admin
        .from("analytics_sessions")
        .select("id, active_seconds")
        .gte("started_at", fromIso)
        .lte("started_at", toIso),
      admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "page_view")
        .gte("occurred_at", fromIso)
        .lte("occurred_at", toIso),
      admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "product_view")
        .gte("occurred_at", fromIso)
        .lte("occurred_at", toIso),
      admin
        .from("analytics_visitors")
        .select("id", { count: "exact", head: true })
        .gte("first_seen_at", fromIso)
        .lte("first_seen_at", toIso),
    ]);

  const sessionsList = sessions || [];
  const activeSeconds = sessionsList.reduce(
    (s, r) => s + Number(r.active_seconds || 0),
    0
  );
  const sessionsCount = sessionsList.length;
  const avgSession =
    sessionsCount > 0 ? Math.round(activeSeconds / sessionsCount) : 0;

  const { count: converted } = await admin
    .from("analytics_visitors")
    .select("id", { count: "exact", head: true })
    .not("converted_at", "is", null)
    .gte("converted_at", fromIso)
    .lte("converted_at", toIso);

  const uniqueInPeriod = visitorsTotal || 0;
  const newCount = newVisitors || 0;
  const returning = Math.max(0, uniqueInPeriod - newCount);

  return NextResponse.json(
    {
      ok: true,
      from: fromIso,
      to: toIso,
      totals: {
        visitors: uniqueInPeriod,
        new_visitors: newCount,
        returning_visitors: returning,
        sessions: sessionsCount,
        page_views: pageEvents || 0,
        product_views: productEvents || 0,
        active_seconds: activeSeconds,
        avg_session_seconds: avgSession,
        converted_visitors: converted || 0,
        conversion_rate:
          uniqueInPeriod > 0
            ? Math.round(((converted || 0) / uniqueInPeriod) * 1000) / 10
            : 0,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
