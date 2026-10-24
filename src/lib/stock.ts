import { supabase, type ProductVariant } from "@/lib/supabase";

/** Reduce product/variant stock after a successful order */
export async function decrementStockForItems(
  items: { productId: string; quantity: number; variant?: string }[]
) {
  for (const item of items) {
    try {
      const { data } = await supabase
        .from("products")
        .select("id, stock, variants")
        .eq("id", item.productId)
        .maybeSingle();
      if (!data) continue;

      const qty = Math.max(1, Number(item.quantity) || 1);
      const variants = (data.variants || []) as ProductVariant[];

      if (variants.length > 0 && item.variant) {
        const label = item.variant.trim();
        const next = variants.map((v) => {
          const vLabel = [v.size, v.color].filter(Boolean).join(" / ");
          if (vLabel === label) {
            return { ...v, stock: Math.max(0, (Number(v.stock) || 0) - qty) };
          }
          return v;
        });
        const total = next.reduce((s, v) => s + (Number(v.stock) || 0), 0);
        await supabase
          .from("products")
          .update({ variants: next, stock: total, updated_at: new Date().toISOString() })
          .eq("id", item.productId);
      } else {
        const stock = Math.max(0, (Number(data.stock) || 0) - qty);
        await supabase
          .from("products")
          .update({ stock, updated_at: new Date().toISOString() })
          .eq("id", item.productId);
      }
    } catch (e) {
      console.error("stock decrement failed", item.productId, e);
    }
  }
}
