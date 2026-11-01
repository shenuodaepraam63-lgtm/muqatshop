"use client";

import { MarketplaceProductCard } from "@/components/home/MarketplaceProductCard";
import type { Product } from "@/lib/supabase";

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <div className="product-grid">
      {products.map((p) => (
        <MarketplaceProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
