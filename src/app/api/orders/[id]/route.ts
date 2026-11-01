import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

/**
 * Customer-only order details.
 * Ownership is verified on the server — order number alone is never enough.
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

    // Core columns only (no migration-dependent fields)
    const { data: row, error } = await admin
      .from("orders")
      .select(
        "id, order_number, customer_name, governorate, center, area, street, apartment, phone, phone_alt, notes, items, subtotal, shipping, discount, coupon_code, total, status, created_at, updated_at, customer_id, customer_email"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("order detail fetch error", error);
      return NextResponse.json({ ok: false, error: "تعذر تحميل الطلب" }, { status: 500 });
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

    const order = {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
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
      shipments: [
        {
          id: `ship-${row.id}`,
          label: "الشحنة الرئيسية",
          status: row.status,
          updatedAt: row.updated_at || row.created_at,
        },
      ],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    console.error("order detail error", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
