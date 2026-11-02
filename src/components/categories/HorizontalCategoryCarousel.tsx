"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  MOTION_EASE,
  MOTION_DURATION,
  MOTION_STAGGER,
  MOTION_STAGGER_MAX,
} from "@/lib/animations/motion-config";
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
  const reduce = useReducedMotion();

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
    <div className="category-carousel" aria-label={ariaLabel}>
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

      {/* Scroll container is NOT transformed — only cards animate */}
      <div ref={scrollerRef} className="category-carousel__track" dir="rtl">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            className="category-card-wrap"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: MOTION_DURATION.medium,
              ease: MOTION_EASE.standard,
              delay: reduce ? 0 : Math.min(i, MOTION_STAGGER_MAX) * MOTION_STAGGER.normal,
            }}
          >
            <Link
              href={item.href}
              className={`category-card${item.active ? " is-active" : ""}`}
            >
              <CategoryImage src={item.image} name={item.name} />
              <span className="category-card__name">{item.name}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
