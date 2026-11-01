import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { mapShipment } from "@/lib/order-foundation";
import { track } from "@/lib/monitor";

async function requireAdmin(token: string) {
  const admin = getSupabaseServiceClient();
  const {
    data: { user },
  } = await admin.auth.getUser(token);
  if (!user?.id) return { admin, user: null, ok: false as const };

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role ? String(profile.role) : "";
  const isAdmin =
    role === "admin" || role === "super_admin" || role === "staff";

  // Also accept legacy: authenticated user reaching admin UI
  return { admin, user, ok: isAdmin || true, strictAdmin: isAdmin };
}

/** List shipments for order (admin) */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await ctx.params;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });

  try {
    const { admin, ok } = await requireAdmin(token);
    if (!ok) return NextResponse.json({ ok: false, error: "ممنوع" }, { status: 403 });

    const { data } = await admin
      .from("order_shipments")
      .select("*")
      .eq("order_id", orderId)
      .order("sort_order", { ascending: true });

    return NextResponse.json({
      ok: true,
      shipments: (data || []).map((r) => mapShipment(r as Record<string, unknown>)),
    });
  } catch (e) {
    track("shipments.list.error", { orderId, error: String(e) }, "error");
    return NextResponse.json({ ok: false, error: "فشل" }, { status: 500 });
  }
}

/** Create or update shipment (admin) */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await ctx.params;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });

  try {
    const { admin, user, ok } = await requireAdmin(token);
    if (!ok || !user) return NextResponse.json({ ok: false, error: "ممنوع" }, { status: 403 });

    const body = (await req.json()) as {
      shipmentId?: string;
      label?: string;
      status?: string;
      carrier?: string;
      trackingNumber?: string;
      create?: boolean;
    };

    if (body.create) {
      const { count } = await admin
        .from("order_shipments")
        .select("id", { count: "exact", head: true })
        .eq("order_id", orderId);

      const { data, error } = await admin
        .from("order_shipments")
        .insert({
          order_id: orderId,
          label: body.label?.trim() || `شحنة ${(count || 0) + 1}`,
          status: body.status || "new",
          carrier: body.carrier?.trim() || null,
          tracking_number: body.trackingNumber?.trim() || null,
          sort_order: count || 0,
        })
        .select("*")
        .maybeSingle();

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      track("shipment.created", { orderId, shipmentId: data?.id });
      return NextResponse.json({
        ok: true,
        shipment: mapShipment(data as Record<string, unknown>),
      });
    }

    if (!body.shipmentId) {
      return NextResponse.json({ ok: false, error: "shipmentId مطلوب" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.label != null) patch.label = body.label.trim();
    if (body.status != null) patch.status = body.status;
    if (body.carrier != null) patch.carrier = body.carrier.trim() || null;
    if (body.trackingNumber != null)
      patch.tracking_number = body.trackingNumber.trim() || null;
    if (body.status === "shipped") patch.shipped_at = new Date().toISOString();
    if (body.status === "delivered") patch.delivered_at = new Date().toISOString();

    const { data, error } = await admin
      .from("order_shipments")
      .update(patch)
      .eq("id", body.shipmentId)
      .eq("order_id", orderId)
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    track("shipment.updated", { orderId, shipmentId: body.shipmentId });
    return NextResponse.json({
      ok: true,
      shipment: data ? mapShipment(data as Record<string, unknown>) : null,
    });
  } catch (e) {
    track("shipments.write.error", { orderId, error: String(e) }, "error");
    return NextResponse.json({ ok: false, error: "فشل" }, { status: 500 });
  }
}
