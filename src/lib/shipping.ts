import { supabase } from "@/lib/supabase";

export const DEFAULT_SHIPPING_FEE = 80;

export type ShippingSettings = {
  fee: number;
  free_over: number | null;
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
  const v = data.value as { fee?: number; free_over?: number | null };
  return {
    fee: typeof v.fee === "number" ? v.fee : DEFAULT_SHIPPING_FEE,
    free_over: typeof v.free_over === "number" ? v.free_over : null,
  };
}

export function calcShipping(
  subtotal: number,
  settings: ShippingSettings
): number {
  if (settings.free_over != null && subtotal >= settings.free_over) return 0;
  return settings.fee;
}
