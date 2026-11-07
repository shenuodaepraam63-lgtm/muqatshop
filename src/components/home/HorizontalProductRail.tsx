"use client";

import { MarketplaceProductCard } from "@/components/home/MarketplaceProductCard";
import type { Product } from "@/lib/supabase";

/** Same horizontal rail as homepage category shelves (fixed card width). */
export function HorizontalProductRail({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <div className="category-product-track" dir="rtl">
      {products.map((p) => (
        <div key={p.id} className="category-product-slot">
          <MarketplaceProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
