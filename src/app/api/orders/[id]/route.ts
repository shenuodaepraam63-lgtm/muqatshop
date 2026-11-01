import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { mapShipment, mapStatusEvent } from "@/lib/order-foundation";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  governorate: string;
  center: string;
  area: string | null;
  street: string | null;
  apartment: string | null;
  phone: string;
  phone_alt: string | null;
  notes: string | null;
  items: unknown;
  subtotal: number;
  shipping: number;
  discount: number | null;
  coupon_code: string | null;
  total: number;
  status: string;
  created_at: string;
  updated_at: string | null;
  customer_id: string | null;
  customer_email: string | null;
  version?: number | null;
};

const ORDER_SELECT =
  "id, order_number, customer_name, governorate, center, area, street, apartment, phone, phone_alt, notes, items, subtotal, shipping, discount, coupon_code, total, status, created_at, updated_at, customer_id, customer_email, version";

const ORDER_SELECT_NO_VERSION =
  "id, order_number, customer_name, governorate, center, area, street, apartment, phone, phone_alt, notes, items, subtotal, shipping, discount, coupon_code, total, status, created_at, updated_at, customer_id, customer_email";

/**
 * Customer-only order details (permanent foundation).
 * Ownership verified on server. Includes shipments + recent status events.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const orderId = String(id || "").trim();
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "معرّف الطلب مطلوب" }, { status: 400 });
    }

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

    const email = (user.email || "").toLowerCase().trim();

    let customerId: string | null = null;
    const { data: byAuth } = await admin
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (byAuth?.id) customerId = byAuth.id as string;

    if (!customerId && email) {
      const { data: byEmail } = await admin
        .from("customers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (byEmail?.id) customerId = byEmail.id as string;
    }

    let row: OrderRow | null = null;

    {
      const first = await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("id", orderId)
        .maybeSingle();

      if (first.error) {
        const msg = String(first.error.message || "");
        if (msg.includes("version")) {
          const retry = await admin
            .from("orders")
            .select(ORDER_SELECT_NO_VERSION)
            .eq("id", orderId)
            .maybeSingle();
          if (retry.error) {
            console.error("order detail fetch error", retry.error);
            return NextResponse.json({ ok: false, error: "تعذر تحميل الطلب" }, { status: 500 });
          }
          row = (retry.data as OrderRow | null) ?? null;
        } else {
          console.error("order detail fetch error", first.error);
          return NextResponse.json({ ok: false, error: "تعذر تحميل الطلب" }, { status: 500 });
        }
      } else {
        row = (first.data as OrderRow | null) ?? null;
      }
    }

    if (!row) {
      return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
    }

    const owns =
      (customerId && row.customer_id === customerId) ||
      (email &&
        row.customer_email &&
        String(row.customer_email).toLowerCase() === email);

    if (!owns) {
      return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
    }

    const items = Array.isArray(row.items) ? row.items : [];
    const safeItems = items.map((it: Record<string, unknown>) => ({
      productId: it.productId ?? it.product_id ?? null,
      name: String(it.name || "منتج"),
      price: Number(it.price) || 0,
      quantity: Math.max(1, Number(it.quantity) || 1),
      image: typeof it.image === "string" ? it.image : null,
      variant: typeof it.variant === "string" ? it.variant : null,
    }));

    let shipments: ReturnType<typeof mapShipment>[] = [];
    const { data: shipRows } = await admin
      .from("order_shipments")
      .select(
        "id, order_id, label, status, carrier, tracking_number, sort_order, shipped_at, delivered_at, created_at, updated_at"
      )
      .eq("order_id", orderId)
      .order("sort_order", { ascending: true });

    if (shipRows && shipRows.length) {
      shipments = shipRows.map((r) => mapShipment(r as Record<string, unknown>));
    } else {
      shipments = [
        {
          id: `legacy-${row.id}`,
          orderId: String(row.id),
          label: "الشحنة الرئيسية",
          status: String(row.status),
          carrier: null,
          trackingNumber: null,
          sortOrder: 0,
          shippedAt: null,
          deliveredAt: null,
          updatedAt: String(row.updated_at || row.created_at),
        },
      ];
    }

    let events: ReturnType<typeof mapStatusEvent>[] = [];
    const { data: eventRows } = await admin
      .from("order_status_events")
      .select("id, order_id, from_status, to_status, actor_type, actor_id, note, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (eventRows?.length) {
      events = eventRows.map((r) => mapStatusEvent(r as Record<string, unknown>));
    }

    const order = {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      version: Number(row.version) || 1,
      customerName: row.customer_name,
      phone: row.phone,
      phoneAlt: row.phone_alt,
      governorate: row.governorate,
      center: row.center,
      area: row.area,
      street: row.street,
      apartment: row.apartment,
      notes: row.notes,
      items: safeItems,
      subtotal: Number(row.subtotal) || 0,
      shipping: Number(row.shipping) || 0,
      discount: Number(row.discount) || 0,
      couponCode: row.coupon_code,
      total: Number(row.total) || 0,
      paymentMethod: "cod",
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    };

    return NextResponse.json({
      ok: true,
      order,
      shipments,
      events,
      eventsNextCursor:
        events.length >= 20 ? events[events.length - 1]?.createdAt ?? null : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    console.error("order detail error", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
