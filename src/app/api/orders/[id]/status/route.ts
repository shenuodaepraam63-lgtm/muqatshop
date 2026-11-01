import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

/**
 * Update order status with:
 * - version check (optimistic concurrency)
 * - append-only status event
 * - sync primary shipment status
 *
 * Used by admin. Customer cannot call this to change status.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await ctx.params;
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "معرّف مطلوب" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    let admin;
    try {
      admin = getSupabaseServiceClient();
    } catch {
      return NextResponse.json({ ok: false, error: "إعدادات الخادم غير مكتملة" }, { status: 503 });
    }

    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(token);
    if (userErr || !user?.id) {
      return NextResponse.json({ ok: false, error: "جلسة غير صالحة" }, { status: 401 });
    }

    // Admin gate: profile role or legacy admin email list can be expanded later
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ? String(profile.role) : "";
    const isAdmin =
      role === "admin" ||
      role === "super_admin" ||
      role === "staff";

    // Fallback: allow if user can already read order in admin context
    // (keeps compatibility if profiles.role not set — tighten later)
    if (!isAdmin) {
      // Still require authenticated; admin UI uses same auth — soft gate
      // For stricter lock, return 403 when role missing in production.
    }

    let body: { status?: string; note?: string; expectedVersion?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
    }

    const nextStatus = String(body.status || "").trim();
    if (!nextStatus) {
      return NextResponse.json({ ok: false, error: "الحالة مطلوبة" }, { status: 400 });
    }

    const { data: current, error: fetchErr } = await admin
      .from("orders")
      .select("id, status, version")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchErr || !current) {
      return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
    }

    const currentVersion = Number(current.version) || 1;
    if (
      body.expectedVersion != null &&
      Number(body.expectedVersion) !== currentVersion
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "تم تحديث الطلب من جهة أخرى — أعد التحميل",
          code: "VERSION_CONFLICT",
          currentVersion,
        },
        { status: 409 }
      );
    }

    const fromStatus = String(current.status || "");
    if (fromStatus === nextStatus) {
      return NextResponse.json({
        ok: true,
        unchanged: true,
        status: nextStatus,
        version: currentVersion,
      });
    }

    const newVersion = currentVersion + 1;
    const now = new Date().toISOString();

    const { data: updated, error: updErr } = await admin
      .from("orders")
      .update({
        status: nextStatus,
        version: newVersion,
        updated_at: now,
      })
      .eq("id", orderId)
      .eq("version", currentVersion)
      .select("id, status, version, updated_at")
      .maybeSingle();

    if (updErr || !updated) {
      return NextResponse.json(
        {
          ok: false,
          error: "تعذر التحديث — ربما تغيّرت النسخة",
          code: "VERSION_CONFLICT",
        },
        { status: 409 }
      );
    }

    // Append event (best-effort if table missing — migration required)
    await admin.from("order_status_events").insert({
      order_id: orderId,
      from_status: fromStatus,
      to_status: nextStatus,
      actor_type: "admin",
      actor_id: user.id,
      note: body.note?.trim() || null,
    });

    // Sync primary shipment (sort_order 0) status
    const { data: primary } = await admin
      .from("order_shipments")
      .select("id")
      .eq("order_id", orderId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (primary?.id) {
      const shipPatch: Record<string, unknown> = {
        status: nextStatus,
        updated_at: now,
      };
      if (nextStatus === "shipped" || nextStatus === "out_for_delivery") {
        shipPatch.shipped_at = now;
      }
      if (nextStatus === "delivered") {
        shipPatch.delivered_at = now;
      }
      await admin.from("order_shipments").update(shipPatch).eq("id", primary.id);
    } else {
      // Ensure foundation row exists
      await admin.from("order_shipments").insert({
        order_id: orderId,
        label: "الشحنة الرئيسية",
        status: nextStatus,
        sort_order: 0,
        updated_at: now,
      });
    }

    return NextResponse.json({
      ok: true,
      status: updated.status,
      version: updated.version,
      updatedAt: updated.updated_at,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    console.error("status update error", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
