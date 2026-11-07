"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MarketplaceProductCard } from "@/components/home/MarketplaceProductCard";
import { ProductCardSkeleton } from "@/components/home/ProductCardSkeleton";
import type { Product } from "@/lib/supabase";

export type ShelfSubcategory = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryShelfData = {
  id: string;
  name: string;
  slug: string;
  href: string;
  subcategories: ShelfSubcategory[];
  products: Product[];
};

function usePerPage() {
  const [n, setN] = useState(2);
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w >= 1024) setN(4);
      else if (w >= 640) setN(3);
      else setN(2);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  return n;
}

export function CategoryProductShelf({ shelf }: { shelf: CategoryShelfData }) {
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const perPage = usePerPage();
  const [page, setPage] = useState(0);
  /** phase: skeleton shell → products rising */
  const [phase, setPhase] = useState<"skeleton" | "cards">("skeleton");

  const filtered = useMemo(() => {
    if (!activeSub) return shelf.products;
    const sub = shelf.subcategories.find((s) => s.slug === activeSub);
    if (!sub) return shelf.products;
    return shelf.products.filter((p) => p.category_id === sub.id);
  }, [shelf, activeSub]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * perPage, safePage * perPage + perPage);

  // On page / filter / perPage change: show skeleton structure first, then cards
  useEffect(() => {
    setPhase("skeleton");
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduce ? 0 : 280;
    const t = window.setTimeout(() => setPhase("cards"), delay);
    return () => window.clearTimeout(t);
  }, [safePage, activeSub, perPage, shelf.id]);

  useEffect(() => {
    setPage(0);
  }, [activeSub, perPage]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setPage((p) => {
        const next = p + dir;
        if (next < 0) return pageCount - 1;
        if (next >= pageCount) return 0;
        return next;
      });
    },
    [pageCount]
  );

  if (!shelf.products.length) return null;

  return (
    <section className="home-section product-shelf-dream" aria-label={shelf.name}>
      <div className="home-container">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#14243A] sm:text-xl">{shelf.name}</h2>
          <Link
            href={shelf.href}
            className="shrink-0 text-xs font-semibold text-[#3157D5] hover:underline sm:text-sm"
          >
            عرض الكل
          </Link>
        </div>

        {shelf.subcategories.length > 0 && (
          <div
            className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar"
            role="tablist"
            aria-label={`تصنيفات ${shelf.name}`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={!activeSub}
              onClick={() => setActiveSub(null)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition sm:text-[13px] ${
                !activeSub
                  ? "border-[#3157D5] bg-[#3157D5] text-white"
                  : "border-[#E4E9F0] bg-white text-[#526174]"
              }`}
            >
              الكل
            </button>
            {shelf.subcategories.map((s) => {
              const on = activeSub === s.slug;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveSub(s.slug)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition sm:text-[13px] ${
                    on
                      ? "border-[#3157D5] bg-[#3157D5] text-white"
                      : "border-[#E4E9F0] bg-white text-[#526174]"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E4E9F0] bg-white py-10 text-center text-sm text-[#718096]">
            لا توجد منتجات في هذا التصنيف حاليًا
          </p>
        ) : (
          <div className="product-shelf-dream__stage">
            {/* Grid: always same slots so skeleton = same structure as products */}
            <div
              className="product-shelf-dream__grid"
              style={{
                gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))`,
              }}
            >
              {phase === "skeleton"
                ? Array.from({ length: perPage }).map((_, i) => (
                    <div key={`sk-${safePage}-${i}`} className="product-shelf-dream__cell">
                      <ProductCardSkeleton />
                    </div>
                  ))
                : pageItems.map((p, i) => (
                    <div
                      key={`${p.id}-${safePage}`}
                      className="product-shelf-dream__cell mq-product-rise is-in"
                      style={{ transitionDelay: `${i * 90}ms` }}
                    >
                      <MarketplaceProductCard product={p} riseDelayMs={0} />
                    </div>
                  ))}
            </div>

            {/* Controls under the stage — like Dream2000 video */}
            {pageCount > 1 && (
              <div className="product-shelf-dream__controls" dir="ltr">
                <button
                  type="button"
                  className="product-shelf-dream__arrow"
                  aria-label="السابق"
                  onClick={() => go(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="product-shelf-dream__dots" role="tablist" aria-label="صفحات المنتجات">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === safePage}
                      aria-label={`صفحة ${i + 1}`}
                      className={`product-shelf-dream__dot${i === safePage ? " is-active" : ""}`}
                      onClick={() => setPage(i)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="product-shelf-dream__arrow"
                  aria-label="التالي"
                  onClick={() => go(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
