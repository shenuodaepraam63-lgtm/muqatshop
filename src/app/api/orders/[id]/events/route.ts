import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { mapStatusEvent } from "@/lib/order-foundation";

/**
 * Cursor-paginated status events for an order (customer must own order).
 * Query: ?cursor=<created_at ISO>&limit=20
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await ctx.params;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    let admin;
    try {
      admin = getSupabaseServiceClient();
    } catch {
      return NextResponse.json({ ok: false, error: "إعدادات الخادم غير مكتملة" }, { status: 503 });
    }

    const {
      data: { user },
    } = await admin.auth.getUser(token);
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: "جلسة غير صالحة" }, { status: 401 });
    }

    const email = (user.email || "").toLowerCase().trim();
    let customerId: string | null = null;
    const { data: byAuth } = await admin
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (byAuth?.id) customerId = byAuth.id as string;

    const { data: order } = await admin
      .from("orders")
      .select("id, customer_id, customer_email")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
    }

    const owns =
      (customerId && order.customer_id === customerId) ||
      (email &&
        order.customer_email &&
        String(order.customer_email).toLowerCase() === email);

    if (!owns) {
      return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
    }

    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));

    let q = admin
      .from("order_status_events")
      .select("id, order_id, from_status, to_status, actor_type, actor_id, note, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      q = q.lt("created_at", cursor);
    }

    const { data, error } = await q;
    if (error) {
      // Table missing → empty list (migration not applied yet)
      console.error("events fetch", error);
      return NextResponse.json({ ok: true, events: [], nextCursor: null });
    }

    const rows = data || [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const events = page.map((r) => mapStatusEvent(r as Record<string, unknown>));
    const nextCursor = hasMore
      ? String(page[page.length - 1]?.created_at || null)
      : null;

    return NextResponse.json({ ok: true, events, nextCursor });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
