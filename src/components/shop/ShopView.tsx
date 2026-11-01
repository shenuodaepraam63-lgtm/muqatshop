"use client";

import { useState } from "react";
import { MarketplaceProductCard } from "@/components/home/MarketplaceProductCard";
import {
  ActiveCategoryHeader,
  ShopCategoryBar,
  ShopSubcategoryBar,
  type ShopCategory,
} from "@/components/shop/ShopCategoryBar";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { ActiveFilterChips, ShopFiltersPanel } from "@/components/shop/ShopFilters";
import { ShopPagination } from "@/components/shop/ShopPagination";
import type { Product } from "@/lib/supabase";

export function ShopView({
  products,
  total,
  page,
  totalPages,
  categories,
  activeCategorySlug,
  title,
  subtitle,
}: {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  categories: ShopCategory[];
  activeCategorySlug: string;
  title: string;
  subtitle?: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasActiveCategory = Boolean(activeCategorySlug);

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-20 md:pb-8">
      <div className="home-container py-6 sm:py-8">
        {!hasActiveCategory && (
          <header className="mb-5">
            <h1 className="text-2xl font-bold text-[#14243A] sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-[#718096]">{subtitle}</p> : null}
          </header>
        )}

        <ShopCategoryBar categories={categories} />

        {hasActiveCategory && (
          <ActiveCategoryHeader categories={categories} productCount={total} />
        )}

        {activeCategorySlug ? (
          <ShopSubcategoryBar categories={categories} parentSlug={activeCategorySlug} />
        ) : null}

        <ActiveFilterChips />

        <div className="flex gap-6">
          <ShopFiltersPanel mode="sidebar" />

          <div className="min-w-0 flex-1">
            <ShopToolbar total={total} onOpenFilters={() => setDrawerOpen(true)} />

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D6DDEA] bg-white px-4 py-16 text-center">
                <p className="font-semibold text-[#14243A]">لا توجد منتجات مطابقة</p>
                <p className="mt-2 text-sm text-[#718096]">
                  جرّب تصنيفًا آخر أو امسح الفلاتر.
                </p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((p) => (
                  <MarketplaceProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            <ShopPagination page={page} totalPages={totalPages} />
          </div>
        </div>
      </div>

      <ShopFiltersPanel
        mode="drawer"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
