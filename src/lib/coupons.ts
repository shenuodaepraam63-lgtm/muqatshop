import { supabase } from "@/lib/supabase";

export type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  min_order: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

export function computeDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discount_type === "percent") {
    return Math.min(subtotal, Math.round((subtotal * Number(coupon.value)) / 100));
  }
  return Math.min(subtotal, Number(coupon.value));
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "أدخل كود الخصم" };

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "كود الخصم غير صالح" };

  const coupon = data as Coupon;

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "انتهت صلاحية الكود" };
  }
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return { ok: false, error: "تم استنفاد استخدامات هذا الكود" };
  }
  const min = Number(coupon.min_order) || 0;
  if (subtotal < min) {
    return {
      ok: false,
      error: `الحد الأدنى للطلب ${min} ج.م`,
    };
  }

  const discount = computeDiscount(coupon, subtotal);
  if (discount <= 0) return { ok: false, error: "لا يمكن تطبيق الخصم" };

  return { ok: true, coupon, discount };
}

export async function incrementCouponUse(couponId: string) {
  const { data } = await supabase
    .from("coupons")
    .select("used_count")
    .eq("id", couponId)
    .maybeSingle();
  const next = (Number(data?.used_count) || 0) + 1;
  await supabase.from("coupons").update({ used_count: next }).eq("id", couponId);
}
