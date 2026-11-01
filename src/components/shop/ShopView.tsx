"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const sp = useSearchParams();
  const router = useRouter();
  const q = (sp.get("q") || "").trim();
  const isSearch = Boolean(q);

  const clearSearch = () => {
    const next = new URLSearchParams(sp.toString());
    next.delete("q");
    next.delete("page");
    const s = next.toString();
    router.push(s ? `/shop?${s}` : "/shop");
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-20 md:pb-8">
      <div className="home-container py-6 sm:py-8">
        {isSearch ? (
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#14243A] sm:text-3xl">
                نتائج البحث عن «{q}»
              </h1>
              <p className="mt-1 text-sm text-[#718096]">{total} نتيجة</p>
            </div>
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-lg border border-[#E5EAF1] bg-white px-3 py-2 text-xs font-semibold text-[#526174] hover:border-[#3157D5]"
            >
              مسح البحث
            </button>
          </header>
        ) : !hasActiveCategory ? (
          <header className="mb-5">
            <h1 className="text-2xl font-bold text-[#14243A] sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-[#718096]">{subtitle}</p> : null}
          </header>
        ) : null}

        {!isSearch && <ShopCategoryBar categories={categories} />}

        {hasActiveCategory && !isSearch && (
          <ActiveCategoryHeader categories={categories} productCount={total} />
        )}

        {activeCategorySlug && !isSearch ? (
          <ShopSubcategoryBar categories={categories} parentSlug={activeCategorySlug} />
        ) : null}

        <ActiveFilterChips />

        <div className="flex gap-6">
          <ShopFiltersPanel mode="sidebar" />

          <div className="min-w-0 flex-1">
            <ShopToolbar total={total} onOpenFilters={() => setDrawerOpen(true)} />

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D6DDEA] bg-white px-4 py-16 text-center">
                {isSearch ? (
                  <>
                    <p className="font-semibold text-[#14243A]">
                      ملقيناش منتجات مطابقة لبحثك.
                    </p>
                    <ul className="mx-auto mt-3 max-w-md list-disc space-y-1 pr-5 text-right text-sm text-[#718096]">
                      <li>تأكد من كتابة الكلمة بشكل صحيح</li>
                      <li>جرّب كلمة بحث أقصر</li>
                      <li>أزل بعض الفلاتر إن وُجدت</li>
                    </ul>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="rounded-xl bg-[#3157D5] px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        مسح البحث
                      </button>
                      <Link
                        href="/shop"
                        className="rounded-xl border border-[#E5EAF1] bg-white px-4 py-2.5 text-sm font-semibold text-[#14243A]"
                      >
                        تصفح المتجر
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-[#14243A]">لا توجد منتجات مطابقة</p>
                    <p className="mt-2 text-sm text-[#718096]">
                      جرّب تصنيفًا آخر أو امسح الفلاتر.
                    </p>
                  </>
                )}
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
