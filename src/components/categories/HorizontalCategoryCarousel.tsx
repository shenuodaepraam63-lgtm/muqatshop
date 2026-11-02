"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInViewOnce } from "@/lib/animations/useInViewOnce";
import "./HorizontalCategoryCarousel.css";

export type HorizontalCategoryItem = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  href: string;
  active?: boolean;
};

function CategoryImage({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  return (
    <div className="category-card__media">
      {showImg ? (
        <Image
          src={src!}
          alt={name}
          fill
          className="category-card__image"
          sizes="(max-width:767px) 108px, (max-width:1023px) 125px, 150px"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="category-card__placeholder" aria-hidden>
          <span>{name.trim().charAt(0) || "؟"}</span>
        </div>
      )}
    </div>
  );
}

export function HorizontalCategoryCarousel({
  items,
  ariaLabel = "التصنيفات",
  showArrows = true,
}: {
  items: HorizontalCategoryItem[];
  ariaLabel?: string;
  showArrows?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [wrapRef, inView] = useInViewOnce({
    threshold: 0.2,
    rootMargin: "0px 0px -8% 0px",
  });

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    const left = Math.abs(scrollLeft);
    setCanPrev(left > 4);
    setCanNext(max - left > 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, items.length]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(280, el.clientWidth * 0.7) * dir;
    el.scrollBy({ left: -amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <div
      ref={wrapRef as React.RefObject<HTMLDivElement>}
      className="category-carousel"
      aria-label={ariaLabel}
    >
      {showArrows && (canPrev || canNext) ? (
        <div className="category-carousel__arrows max-md:hidden">
          <button
            type="button"
            className="category-carousel__arrow"
            aria-label="السابق"
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="category-carousel__arrow"
            aria-label="التالي"
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div ref={scrollerRef} className="category-carousel__track" dir="rtl">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`category-card-wrap mq-rise${inView ? " is-in" : ""}`}
            style={{
              transitionDelay: inView ? `${Math.min(i, 10) * 60}ms` : "0ms",
            }}
          >
            <Link
              href={item.href}
              className={`category-card${item.active ? " is-active" : ""}`}
            >
              <CategoryImage src={item.image} name={item.name} />
              <span className="category-card__name">{item.name}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
