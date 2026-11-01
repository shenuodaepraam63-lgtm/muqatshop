"use client";

import { useEffect, useState } from "react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { MarketplaceProductCard } from "@/components/home/MarketplaceProductCard";
import type { Product } from "@/lib/supabase";

export function ProductRecentlyViewed({ excludeId }: { excludeId: string }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const list = getRecentlyViewed()
      .filter((p) => p.id !== excludeId)
      .slice(0, 8)
      .map(
        (p) =>
          ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            compare_at_price: p.compare_at_price ?? null,
            sale_ends_at: p.sale_ends_at ?? null,
            images: p.image ? [p.image] : [],
            main_image_index: 0,
            stock: p.stock ?? 0,
            is_active: true,
          }) as Product
      );
    setItems(list);
  }, [excludeId]);

  if (!items.length) return null;

  return (
    <section className="home-container mb-16" aria-label="شاهدتها مؤخرًا">
      <h2 className="mb-4 text-lg font-bold text-[#14243A] sm:text-[22px]">شاهدتها مؤخرًا</h2>
      <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar sm:gap-4">
        {items.map((p) => (
          <MarketplaceProductCard key={p.id} product={p} compact />
        ))}
      </div>
    </section>
  );
}
