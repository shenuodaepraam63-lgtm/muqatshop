"use client";

import { MarketplaceProductCard } from "@/components/home/MarketplaceProductCard";
import type { Product } from "@/lib/supabase";

export function HorizontalProductRail({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 no-scrollbar snap-x">
      {products.map((p) => (
        <div key={p.id} className="snap-start">
          <MarketplaceProductCard product={p} compact />
        </div>
      ))}
    </div>
  );
}
