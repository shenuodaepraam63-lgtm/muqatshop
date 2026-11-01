"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HorizontalProductRail } from "@/components/home/HorizontalProductRail";
import { readRecentlyViewed } from "@/lib/recently-viewed";
import type { Product } from "@/lib/supabase";

export function RecentlyViewedSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const list = readRecentlyViewed();
    setProducts(
      list.map(
        (r) =>
          ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            price: r.price,
            compare_at_price: r.compare_at_price ?? null,
            sale_ends_at: r.sale_ends_at ?? null,
            images: r.image ? [r.image] : [],
            main_image_index: 0,
            stock: r.stock ?? 1,
            variants: r.variants ?? null,
            is_active: true,
            is_featured: false,
            category_id: null,
            description: null,
            brand: null,
            material: null,
            colors: null,
            features: null,
            specs: null,
            weight: null,
            dimensions: null,
            origin_country: null,
            care_instructions: null,
          }) as Product
      )
    );
  }, []);

  if (!products.length) return null;

  return (
    <section className="home-section" aria-label="شوهدت مؤخرًا">
      <div className="home-container">
        <SectionHeader title="شوهدت مؤخرًا" />
        <HorizontalProductRail products={products} />
      </div>
    </section>
  );
}
