import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { isAllowedEventType, type AnalyticsEventType } from "./types";

const META_MAX = 1500;

export function sanitizeMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, unknown> = {};
  const banned = [
    "password",
    "token",
    "secret",
    "card",
    "cvv",
    "phone",
    "email",
    "address",
    "authorization",
  ];
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (banned.some((b) => key.includes(b))) continue;
    if (typeof v === "string") out[k] = v.slice(0, 200);
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  const raw = JSON.stringify(out);
  if (raw.length > META_MAX) return {};
  return out;
}

export async function recordEvent(opts: {
  visitorId: string;
  sessionId: string;
  userId?: string | null;
  eventKey: string;
  eventType: string;
  path?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  metadata?: unknown;
  sourceEntityId?: string | null;
}): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  if (!isAllowedEventType(opts.eventType)) {
    return { ok: false, error: "INVALID_EVENT_TYPE" };
  }
  if (!/^[0-9a-fA-F-]{36}$/.test(opts.eventKey)) {
    return { ok: false, error: "INVALID_EVENT_KEY" };
  }

  const admin = getSupabaseServiceClient();
  const type = opts.eventType as AnalyticsEventType;

  if (type === "product_view" && opts.productId) {
    const { data } = await admin
      .from("products")
      .select("id")
      .eq("id", opts.productId)
      .maybeSingle();
    if (!data) return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }
  if (type === "category_view" && opts.categoryId) {
    const { data } = await admin
      .from("categories")
      .select("id")
      .eq("id", opts.categoryId)
      .maybeSingle();
    if (!data) return { ok: false, error: "CATEGORY_NOT_FOUND" };
  }

  if (type === "purchase" && opts.sourceEntityId) {
    const { data: existing } = await admin
      .from("analytics_events")
      .select("id")
      .eq("event_type", "purchase")
      .eq("source_entity_id", opts.sourceEntityId)
      .maybeSingle();
    if (existing) return { ok: true, duplicate: true };
  }

  const meta = sanitizeMetadata(opts.metadata);
  const { error } = await admin.from("analytics_events").insert({
    event_key: opts.eventKey,
    visitor_id: opts.visitorId,
    session_id: opts.sessionId,
    user_id: opts.userId || null,
    event_type: type,
    path: opts.path?.slice(0, 500) || null,
    product_id: opts.productId || null,
    category_id: opts.categoryId || null,
    metadata: meta,
    source_entity_id: opts.sourceEntityId || null,
    occurred_at: new Date().toISOString(),
  });

  if (error) {
    if (String(error.message || "").includes("duplicate") || error.code === "23505") {
      return { ok: true, duplicate: true };
    }
    return { ok: false, error: error.message };
  }

  // counters
  const { data: session } = await admin
    .from("analytics_sessions")
    .select("page_views, product_views")
    .eq("id", opts.sessionId)
    .maybeSingle();
  const { data: visitor } = await admin
    .from("analytics_visitors")
    .select("total_page_views, total_product_views")
    .eq("id", opts.visitorId)
    .maybeSingle();

  if (type === "page_view") {
    await admin
      .from("analytics_sessions")
      .update({
        page_views: Number(session?.page_views || 0) + 1,
        last_activity_at: new Date().toISOString(),
        exit_path: opts.path?.slice(0, 500) || null,
      })
      .eq("id", opts.sessionId);
    await admin
      .from("analytics_visitors")
      .update({
        total_page_views: Number(visitor?.total_page_views || 0) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", opts.visitorId);
  }
  if (type === "product_view") {
    await admin
      .from("analytics_sessions")
      .update({
        product_views: Number(session?.product_views || 0) + 1,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", opts.sessionId);
    await admin
      .from("analytics_visitors")
      .update({
        total_product_views: Number(visitor?.total_product_views || 0) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", opts.visitorId);
  }

  return { ok: true };
}

/** Server-only purchase event (order create). */
export async function recordPurchaseServer(opts: {
  orderId: string;
  orderNumber?: string;
  userId?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
}) {
  if (!opts.visitorId || !opts.sessionId) return;
  const key = crypto.randomUUID();
  await recordEvent({
    visitorId: opts.visitorId,
    sessionId: opts.sessionId,
    userId: opts.userId,
    eventKey: key,
    eventType: "purchase",
    sourceEntityId: opts.orderId,
    metadata: { order_number: opts.orderNumber || null },
  });
}
