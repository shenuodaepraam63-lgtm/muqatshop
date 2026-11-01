import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

/** Digits only for Egyptian phone comparison */
function digitsOnly(v: string): string {
  return String(v || "").replace(/\D/g, "");
}

/**
 * Compare phones loosely but safely:
 * - require at least 7 matching trailing digits
 * - accept with/without country code 20
 */
function phonesMatch(stored: string, input: string): boolean {
  const a = digitsOnly(stored);
  const b = digitsOnly(input);
  if (a.length < 7 || b.length < 7) return false;

  const norm = (d: string) => {
    if (d.startsWith("20") && d.length >= 11) return d.slice(2);
    if (d.startsWith("0") && d.length >= 10) return d.slice(1);
    return d;
  };

  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return true;
  if (na.endsWith(nb) || nb.endsWith(na)) return true;
  // last 9 digits (local mobile without leading 0)
  const ta = na.slice(-9);
  const tb = nb.slice(-9);
  return ta.length >= 7 && ta === tb;
}

const GENERIC_FAIL = "لم يتم العثور على طلب بهذه البيانات";

/**
 * Public tracking — never exposes full order without phone proof.
 * order_number alone is NOT sufficient.
 */
export async function POST(req: NextRequest) {
  try {
    let body: { orderNumber?: string; phone?: string };
    try {
      body = (await req.json()) as { orderNumber?: string; phone?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
    }

    const orderNumber = String(body.orderNumber || "").trim();
    const phone = String(body.phone || "").trim();

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { ok: false, error: "رقم الطلب ورقم الهاتف مطلوبان" },
        { status: 400 }
      );
    }

    if (digitsOnly(phone).length < 7) {
      return NextResponse.json(
        { ok: false, error: "أدخل رقم هاتف صحيح" },
        { status: 400 }
      );
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

    const { data: row, error } = await admin
      .from("orders")
      .select(
        "id, order_number, customer_name, phone, phone_alt, governorate, center, items, subtotal, shipping, discount, coupon_code, total, status, created_at, updated_at"
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error) {
      console.error("public track error", error);
      return NextResponse.json({ ok: false, error: "تعذر البحث" }, { status: 500 });
    }

    // Same message whether missing or phone mismatch — no existence leak
    if (!row) {
      return NextResponse.json({ ok: false, error: GENERIC_FAIL }, { status: 404 });
    }

    const primaryOk = phonesMatch(String(row.phone || ""), phone);
    const altOk = row.phone_alt
      ? phonesMatch(String(row.phone_alt), phone)
      : false;

    if (!primaryOk && !altOk) {
      return NextResponse.json({ ok: false, error: GENERIC_FAIL }, { status: 404 });
    }

    const items = Array.isArray(row.items) ? row.items : [];
    const safeItems = items.map((it: Record<string, unknown>) => ({
      name: String(it.name || "منتج"),
      quantity: Math.max(1, Number(it.quantity) || 1),
      price: Number(it.price) || 0,
      variant: typeof it.variant === "string" ? it.variant : null,
    }));

    // Limited public payload — no internal ids beyond order number display,
    // no merchant, no full address street details beyond city-level
    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: row.order_number,
        status: row.status,
        customerName: row.customer_name,
        governorate: row.governorate,
        center: row.center,
        items: safeItems,
        subtotal: Number(row.subtotal) || 0,
        shipping: Number(row.shipping) || 0,
        discount: Number(row.discount) || 0,
        couponCode: row.coupon_code,
        total: Number(row.total) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
        paymentMethod: "cod",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    console.error("track route error", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
