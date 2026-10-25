import { supabase } from "@/lib/supabase";

export const DEFAULT_SHIPPING_FEE = 80;

/** رسوم شحن حسب المحافظة (ج.م) — قابلة للتعديل من الإعدادات لاحقًا */
export const GOVERNORATE_SHIPPING: Record<string, number> = {
  القاهرة: 90,
  الجيزة: 90,
  القليوبية: 95,
  الإسكندرية: 100,
  البحيرة: 110,
  المنوفية: 105,
  الغربية: 105,
  الدقهلية: 110,
  الشرقية: 110,
  "كفر الشيخ": 115,
  دمياط: 115,
  بورسعيد: 110,
  الإسماعيلية: 110,
  السويس: 105,
  الفيوم: 115,
  "بني سويف": 120,
  المنيا: 125,
  أسيوط: 130,
  سوهاج: 135,
  قنا: 140,
  الأقصر: 145,
  أسوان: 150,
  "البحر الأحمر": 160,
  "الوادي الجديد": 170,
  مطروح: 160,
  "شمال سيناء": 170,
  "جنوب سيناء": 165,
};

export type ShippingSettings = {
  fee: number;
  free_over: number | null;
  /** إن وُجدت تتجاوز الجدول الافتراضي */
  by_governorate?: Record<string, number>;
};

export async function getShippingSettings(): Promise<ShippingSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "shipping")
    .maybeSingle();

  if (!data?.value || typeof data.value !== "object") {
    return { fee: DEFAULT_SHIPPING_FEE, free_over: null };
  }
  const v = data.value as {
    fee?: number;
    free_over?: number | null;
    by_governorate?: Record<string, number>;
  };
  return {
    fee: typeof v.fee === "number" ? v.fee : DEFAULT_SHIPPING_FEE,
    free_over: typeof v.free_over === "number" ? v.free_over : null,
    by_governorate:
      v.by_governorate && typeof v.by_governorate === "object"
        ? v.by_governorate
        : undefined,
  };
}

/** شحن ثابت قديم (بدون محافظة) */
export function calcShipping(
  subtotal: number,
  settings: ShippingSettings
): number {
  if (settings.free_over != null && subtotal >= settings.free_over) return 0;
  return settings.fee;
}

/** شحن حسب المحافظة — الأولوية: إعدادات الموقع ثم الجدول الافتراضي ثم fee العام */
export function shippingForGovernorate(
  governorate: string,
  subtotal: number,
  settings?: ShippingSettings | null
): number {
  if (!governorate) return 0;
  if (settings?.free_over != null && subtotal >= settings.free_over) return 0;

  const custom = settings?.by_governorate?.[governorate];
  if (typeof custom === "number") return custom;

  if (governorate in GOVERNORATE_SHIPPING) {
    return GOVERNORATE_SHIPPING[governorate];
  }

  return settings?.fee ?? DEFAULT_SHIPPING_FEE;
}

export function formatShipLabel(governorate: string, fee: number): string {
  if (!governorate) return "—";
  return `${governorate} (${fee} ج.م شحن)`;
}
