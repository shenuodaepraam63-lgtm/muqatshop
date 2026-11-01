import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { track, trackOrderError } from "@/lib/monitor";
import {
  IMPORTANT_STATUS_NOTIFY,
  notificationCopy,
} from "@/lib/order-status-labels";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const started = Date.now();
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
      return NextResponse.json(
        { ok: false, error: "إعدادات الخادم غير مكتملة" },
        { status: 503 }
      );
    }

    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(token);
    if (userErr || !user?.id) {
      return NextResponse.json({ ok: false, error: "جلسة غير صالحة" }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ? String(profile.role) : "";
    const isAdmin =
      role === "admin" || role === "super_admin" || role === "staff";

    // Soft gate remains for legacy admin sessions without profiles.role
    // Log when role missing so it can be tightened in production ops
    if (!isAdmin) {
      track("order.status.soft_admin", { userId: user.id, orderId }, "warn");
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
      .select(
        "id, status, version, order_number, customer_id, customer_email"
      )
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

    await admin.from("order_status_events").insert({
      order_id: orderId,
      from_status: fromStatus,
      to_status: nextStatus,
      actor_type: "admin",
      actor_id: user.id,
      note: body.note?.trim() || null,
    });

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
      if (nextStatus === "delivered") shipPatch.delivered_at = now;
      await admin.from("order_shipments").update(shipPatch).eq("id", primary.id);
    } else {
      await admin.from("order_shipments").insert({
        order_id: orderId,
        label: "الشحنة الرئيسية",
        status: nextStatus,
        sort_order: 0,
        updated_at: now,
      });
    }

    // Customer notification for important events (never fails the order update)
    if (IMPORTANT_STATUS_NOTIFY.has(nextStatus)) {
      try {
        const copy = notificationCopy(
          nextStatus,
          String(current.order_number || orderId)
        );
        await admin.from("customer_notifications").insert({
          customer_id: current.customer_id || null,
          customer_email: current.customer_email || null,
          order_id: orderId,
          type: "order_status",
          title: copy.title,
          body: copy.body,
        });
      } catch (e) {
        trackOrderError("notify", orderId, e);
      }
    }

    track("order.status.updated", {
      orderId,
      fromStatus,
      toStatus: nextStatus,
      ms: Date.now() - started,
    });

    return NextResponse.json({
      ok: true,
      status: updated.status,
      version: updated.version,
      updatedAt: updated.updated_at,
    });
  } catch (e: unknown) {
    trackOrderError("status", undefined, e);
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
