import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import {
  DEFAULT_SHIPPING_FEE,
  shippingForGovernorate,
  type ShippingSettings,
} from "@/lib/shipping";
import { computeDiscount, type Coupon } from "@/lib/coupons";
import type { ProductVariant } from "@/lib/supabase";

type OrderItemInput = {
  productId: string;
  quantity: number;
  variant?: string;
  price?: number;
  name?: string;
  image?: string;
  basePrice?: number;
};

type CreateOrderBody = {
  idempotencyKey?: string;
  fullName: string;
  phone: string;
  phoneAlt?: string;
  governorate: string;
  center: string;
  area?: string;
  street?: string;
  apartment?: string;
  notes?: string;
  couponCode?: string | null;
  items: OrderItemInput[];
  merchantId?: string | null;
  refMerchantId?: string | null;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!token) return bad("يجب تسجيل الدخول لإتمام الطلب", 401);

    let admin;
    try {
      admin = getSupabaseServiceClient();
    } catch {
      return bad("إعدادات الخادم غير مكتملة", 503);
    }

    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(token);

    if (userErr || !user?.id) return bad("جلسة غير صالحة", 401);

    let body: CreateOrderBody;
    try {
      body = (await req.json()) as CreateOrderBody;
    } catch {
      return bad("بيانات غير صالحة");
    }

    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const governorate = String(body.governorate || "").trim();
    const center = String(body.center || "").trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!fullName || !phone || !governorate || !center) {
      return bad("أكمل الاسم والهاتف والمحافظة والمركز");
    }
    if (items.length === 0) return bad("السلة فارغة");

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
        .select("id, auth_user_id")
        .eq("email", email)
        .maybeSingle();
      if (byEmail?.id) {
        customerId = byEmail.id as string;
        if (!byEmail.auth_user_id) {
          await admin
            .from("customers")
            .update({ auth_user_id: user.id })
            .eq("id", customerId);
        }
      }
    }

    if (!customerId && email) {
      const metaName =
        (typeof user.user_metadata?.full_name === "string" &&
          user.user_metadata.full_name) ||
        fullName;
      const { data: created } = await admin
        .from("customers")
        .insert({
          email,
          name: metaName,
          phone,
          password_hash: `auth:${user.id}`,
          email_verified: !!user.email_confirmed_at,
          is_active: true,
          auth_user_id: user.id,
        })
        .select("id")
        .maybeSingle();
      if (created?.id) customerId = created.id as string;
    }

    // Anti-duplicate: same customer + phone within last 90 seconds
    const since = new Date(Date.now() - 90 * 1000).toISOString();
    if (customerId) {
      const { data: recent } = await admin
        .from("orders")
        .select("id, order_number, total, status, phone")
        .eq("customer_id", customerId)
        .eq("phone", phone)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recent?.order_number) {
        return NextResponse.json({
          ok: true,
          duplicate: true,
          orderNumber: recent.order_number,
          orderId: recent.id,
          total: recent.total,
          status: recent.status,
        });
      }
    }

    const productIds = [...new Set(items.map((i) => String(i.productId)))];
    const { data: products, error: prodErr } = await admin
      .from("products")
      .select("id, name, price, stock, variants, images, is_active")
      .in("id", productIds);

    if (prodErr) return bad("تعذر التحقق من المنتجات", 500);

    const productMap = new Map(
      (products || []).map((p) => [p.id as string, p])
    );

    const isMerchantOrder = Boolean(body.merchantId);
    const validatedItems: {
      productId: string;
      name: string;
      price: number;
      basePrice: number;
      quantity: number;
      image: string;
      variant?: string;
    }[] = [];

    let subtotal = 0;
    let baseSubtotal = 0;

    for (const raw of items) {
      const productId = String(raw.productId || "");
      const qty = Math.max(1, Math.floor(Number(raw.quantity) || 1));
      const product = productMap.get(productId);

      if (!product || product.is_active === false) {
        return bad(`منتج غير متاح: ${raw.name || productId}`);
      }

      const variants = (product.variants || []) as ProductVariant[];
      const variantLabel = raw.variant?.trim() || "";
      let unitBase = Number(product.price) || 0;
      let availableStock = Number(product.stock) || 0;

      if (variants.length > 0 && variantLabel) {
        const match = variants.find((v) => {
          const label = [v.size, v.color].filter(Boolean).join(" / ");
          return label === variantLabel;
        });
        if (!match) {
          return bad(`خيار غير متاح للمنتج: ${product.name}`);
        }
        if (match.price != null && Number(match.price) > 0) {
          unitBase = Number(match.price);
        }
        availableStock = Number(match.stock) || 0;
      }

      if (availableStock < qty) {
        return bad(
          `المخزون غير كافٍ لـ «${product.name}» (المتوفر: ${availableStock})`
        );
      }

      let unitPrice = unitBase;
      if (isMerchantOrder && raw.price != null) {
        const clientPrice = Number(raw.price);
        if (!Number.isNaN(clientPrice) && clientPrice >= unitBase) {
          unitPrice = clientPrice;
        }
      }

      const images = (product.images || []) as string[];
      const image =
        raw.image ||
        (Array.isArray(images) && images[0] ? String(images[0]) : "");

      validatedItems.push({
        productId,
        name: String(product.name),
        price: unitPrice,
        basePrice: unitBase,
        quantity: qty,
        image,
        variant: variantLabel || undefined,
      });

      subtotal += unitPrice * qty;
      baseSubtotal += unitBase * qty;
    }

    let discount = 0;
    let couponCode: string | null = null;
    let couponId: string | null = null;

    const requestedCoupon = String(body.couponCode || "")
      .trim()
      .toUpperCase();
    if (requestedCoupon && !isMerchantOrder) {
      const { data: couponRow } = await admin
        .from("coupons")
        .select("*")
        .eq("code", requestedCoupon)
        .eq("is_active", true)
        .maybeSingle();

      if (!couponRow) return bad("كود الخصم غير صالح");

      const coupon = couponRow as Coupon;
      if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
        return bad("انتهت صلاحية الكود");
      }
      if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
        return bad("تم استنفاد استخدامات هذا الكود");
      }
      const min = Number(coupon.min_order) || 0;
      if (subtotal < min) {
        return bad(`الحد الأدنى للطلب ${min} ج.م`);
      }

      discount = computeDiscount(coupon, subtotal);
      if (discount <= 0) return bad("لا يمكن تطبيق الخصم");
      couponCode = coupon.code;
      couponId = coupon.id;
    }

    let shipSettings: ShippingSettings = {
      fee: DEFAULT_SHIPPING_FEE,
      free_over: 1000,
    };
    const { data: shipRow } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "shipping")
      .maybeSingle();
    if (shipRow?.value && typeof shipRow.value === "object") {
      const v = shipRow.value as {
        fee?: number;
        free_over?: number | null;
        by_governorate?: Record<string, number>;
      };
      shipSettings = {
        fee: typeof v.fee === "number" ? v.fee : DEFAULT_SHIPPING_FEE,
        free_over: typeof v.free_over === "number" ? v.free_over : 1000,
        by_governorate: v.by_governorate,
      };
    }

    const net = Math.max(0, subtotal - discount);
    const shipping = shippingForGovernorate(governorate, net, shipSettings);
    const total = net + shipping;

    let merchantId: string | null = body.merchantId || body.refMerchantId || null;
    let merchantProfit = 0;
    if (body.merchantId) {
      merchantProfit = Math.max(0, subtotal - baseSubtotal);
    } else if (body.refMerchantId) {
      const { data: m } = await admin
        .from("merchants")
        .select("commission_percent")
        .eq("id", body.refMerchantId)
        .maybeSingle();
      const pct = m?.commission_percent != null ? Number(m.commission_percent) : 0;
      merchantProfit = Math.round((net * pct) / 100);
      merchantId = body.refMerchantId;
    }

    const orderNumber = merchantId
      ? `MQ-M-${Date.now().toString(36).toUpperCase()}`
      : `MQ-${Date.now().toString(36).toUpperCase()}`;

    const noteParts: string[] = [];
    if (body.notes?.trim()) noteParts.push(body.notes.trim());

    // Core columns only (no migration required)
    const payload: Record<string, unknown> = {
      order_number: orderNumber,
      customer_name: fullName,
      governorate,
      center,
      area: body.area?.trim() || null,
      street: body.street?.trim() || null,
      apartment: body.apartment?.trim() || null,
      phone,
      phone_alt: body.phoneAlt?.trim() || null,
      notes: noteParts.length ? noteParts.join(" | ") : null,
      items: validatedItems,
      subtotal,
      shipping,
      discount,
      coupon_code: couponCode,
      total,
      status: "new",
    };

    if (customerId) payload.customer_id = customerId;
    if (email) payload.customer_email = email;

    // Optional columns — ignored if not in schema
    payload.payment_method = "cod";

    if (merchantId) {
      payload.merchant_id = merchantId;
      payload.base_subtotal = body.merchantId ? baseSubtotal : net;
      payload.merchant_profit = merchantProfit;
      payload.profit_released = false;
    }

    let order: { id: string; order_number: string; total: number; status: string } | null =
      null;

    {
      const { data, error: insertError } = await admin
        .from("orders")
        .insert(payload)
        .select("id, order_number, total, status")
        .maybeSingle();

      if (insertError) {
        // Retry without payment_method if column missing
        if (
          insertError.message?.includes("payment_method") ||
          insertError.code === "PGRST204"
        ) {
          delete payload.payment_method;
          const retry = await admin
            .from("orders")
            .insert(payload)
            .select("id, order_number, total, status")
            .maybeSingle();
          if (retry.error) {
            console.error("order insert failed", retry.error);
            return bad(retry.error.message || "تعذر إنشاء الطلب", 500);
          }
          order = retry.data;
        } else {
          console.error("order insert failed", insertError);
          return bad(insertError.message || "تعذر إنشاء الطلب", 500);
        }
      } else {
        order = data;
      }
    }

    for (const item of validatedItems) {
      try {
        const product = productMap.get(item.productId);
        if (!product) continue;
        const variants = (product.variants || []) as ProductVariant[];
        const qty = item.quantity;

        if (variants.length > 0 && item.variant) {
          const next = variants.map((v) => {
            const label = [v.size, v.color].filter(Boolean).join(" / ");
            if (label === item.variant) {
              return {
                ...v,
                stock: Math.max(0, (Number(v.stock) || 0) - qty),
              };
            }
            return v;
          });
          const totalStock = next.reduce(
            (s, v) => s + (Number(v.stock) || 0),
            0
          );
          await admin
            .from("products")
            .update({
              variants: next,
              stock: totalStock,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.productId);
        } else {
          const stock = Math.max(0, (Number(product.stock) || 0) - qty);
          await admin
            .from("products")
            .update({ stock, updated_at: new Date().toISOString() })
            .eq("id", item.productId);
        }
      } catch (e) {
        console.error("stock decrement failed", item.productId, e);
      }
    }

    if (couponId) {
      const { data: c } = await admin
        .from("coupons")
        .select("used_count")
        .eq("id", couponId)
        .maybeSingle();
      const next = (Number(c?.used_count) || 0) + 1;
      await admin.from("coupons").update({ used_count: next }).eq("id", couponId);
    }

    return NextResponse.json({
      ok: true,
      orderNumber: order?.order_number || orderNumber,
      orderId: order?.id,
      total: order?.total ?? total,
      status: order?.status || "new",
      shipping,
      discount,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    console.error("create order error", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
