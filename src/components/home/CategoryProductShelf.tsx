"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MarketplaceProductCard } from "@/components/home/MarketplaceProductCard";
import { useInViewOnce } from "@/lib/animations/useInViewOnce";
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

export function CategoryProductShelf({ shelf }: { shelf: CategoryShelfData }) {
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [sectionRef, sectionIn] = useInViewOnce({
    threshold: 0.15,
    rootMargin: "0px 0px -10% 0px",
  });

  const filtered = useMemo(() => {
    if (!activeSub) return shelf.products;
    const sub = shelf.subcategories.find((s) => s.slug === activeSub);
    if (!sub) return shelf.products;
    return shelf.products.filter((p) => p.category_id === sub.id);
  }, [shelf, activeSub]);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const left = Math.abs(el.scrollLeft);
    setCanPrev(left > 6);
    setCanNext(max - left > 6);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, filtered.length, activeSub]);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
  }, [activeSub]);

  if (!shelf.products.length) return null;

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.85, 360);
    el.scrollBy({ left: -dir * step, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="home-section"
      aria-label={shelf.name}
    >
      <div className="home-container">
        <div
          className={`mb-3 flex items-center justify-between gap-3 mq-rise${sectionIn ? " is-in" : ""}`}
          style={{ transitionDelay: sectionIn ? "0ms" : "0ms" }}
        >
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
            className={`mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar mq-rise${sectionIn ? " is-in" : ""}`}
            style={{ transitionDelay: sectionIn ? "60ms" : "0ms" }}
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
                  : "border-[#E4E9F0] bg-white text-[#526174] hover:border-[#3157D5]"
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
                      : "border-[#E4E9F0] bg-white text-[#526174] hover:border-[#3157D5]"
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
          <div className="relative">
            {(canPrev || canNext) && (
              <div className="pointer-events-none absolute inset-y-0 inset-x-0 z-10 hidden items-center justify-between md:flex">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={() => scroll(-1)}
                  className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-[#E4E9F0] bg-white text-[#14243A] shadow-md disabled:opacity-30"
                  aria-label="السابق"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => scroll(1)}
                  className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-[#E4E9F0] bg-white text-[#14243A] shadow-md disabled:opacity-30"
                  aria-label="التالي"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
            )}

            <div ref={trackRef} className="category-product-track" dir="rtl">
              {filtered.map((p, i) => (
                <div
                  key={`${activeSub || "all"}-${p.id}`}
                  className={`category-product-slot snap-start mq-rise${sectionIn ? " is-in" : ""}`}
                  style={{
                    transitionDelay: sectionIn
                      ? `${Math.min(i, 8) * 55}ms`
                      : "0ms",
                  }}
                >
                  <MarketplaceProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
