"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicCampaign } from "@/lib/campaigns";

export type PromoSlide = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  image?: string | null;
  mobileImage?: string | null;
  buttonText?: string;
  tone?: "navy" | "blue" | "teal";
  price?: number | null;
  compareAtPrice?: number | null;
  endsLabel?: string | null;
};

function toSlide(c: PublicCampaign | PromoSlide): PromoSlide {
  return {
    id: c.id,
    title: c.title,
    subtitle: "subtitle" in c ? c.subtitle : undefined,
    href: c.href,
    image: "image" in c ? c.image : (c as PromoSlide).image,
    mobileImage:
      "mobileImage" in c ? c.mobileImage : (c as PromoSlide).mobileImage,
    buttonText:
      "buttonText" in c && c.buttonText
        ? c.buttonText
        : (c as PromoSlide).buttonText || "اطلبها الآن",
    tone: (c as PromoSlide).tone,
    price: (c as PromoSlide).price ?? (c as PublicCampaign).price ?? null,
    compareAtPrice:
      (c as PromoSlide).compareAtPrice ??
      (c as PublicCampaign).compareAtPrice ??
      null,
    endsLabel:
      (c as PromoSlide).endsLabel ?? (c as PublicCampaign).endsLabel ?? null,
  };
}

function formatEgp(n: number) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return "";
  return `${v.toLocaleString("en-EG")} جنيه`;
}

export function PromoSlider({
  slides,
  autoplay = true,
  intervalMs = 5000,
}: {
  slides: (PromoSlide | PublicCampaign)[];
  autoplay?: boolean;
  intervalMs?: number;
}) {
  const list = slides.map(toSlide);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const fn = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (list.length <= 1) return;
      setIndex((i) => (i + dir + list.length) % list.length);
      setPaused(true);
    },
    [list.length]
  );

  useEffect(() => {
    if (!autoplay || list.length <= 1 || paused || reduceMotion) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, Math.max(2500, intervalMs));
    return () => window.clearInterval(t);
  }, [list.length, paused, autoplay, intervalMs, reduceMotion]);

  useEffect(() => {
    if (!paused) return;
    const t = window.setTimeout(() => setPaused(false), 8000);
    return () => window.clearTimeout(t);
  }, [paused, index]);

  if (!list.length) return null;

  const slide = list[index];
  const desktopImg = slide.image;
  const mobileImg = slide.mobileImage || slide.image;
  const price =
    slide.price != null && Number.isFinite(Number(slide.price))
      ? Number(slide.price)
      : null;
  const compare =
    slide.compareAtPrice != null && Number.isFinite(Number(slide.compareAtPrice))
      ? Number(slide.compareAtPrice)
      : null;
  const onSale = price != null && compare != null && compare > price;

  return (
    <section
      className="home-section"
      aria-roledescription="carousel"
      aria-label="الحملات الإعلانية"
    >
      <div className="home-container relative">
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) < 40) return;
            go(dx > 0 ? -1 : 1);
          }}
        >
          <article className="overflow-hidden rounded-[20px] max-md:rounded-[16px] bg-[#14243A] text-white shadow-[0_8px_30px_rgba(20,36,58,0.14)]">
            <div className="relative flex items-center justify-between px-4 pt-3 sm:px-5">
              <span className="text-xs font-bold tracking-wide text-white/90 sm:text-sm">
                Muqatshop
              </span>
              <span className="rounded-full bg-[#22c55e]/15 px-2.5 py-1 text-[10px] font-bold text-[#86efac] sm:text-[11px]">
                عرض خاص
              </span>
            </div>

            <div className="relative mx-auto mt-2 w-full max-w-lg px-3 sm:max-w-2xl sm:px-6">
              <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                {desktopImg ? (
                  <Image
                    src={desktopImg}
                    alt={slide.title}
                    fill
                    className="hidden object-contain object-center sm:block"
                    sizes="(max-width:1024px) 92vw, 720px"
                    priority={index === 0}
                  />
                ) : null}
                {mobileImg ? (
                  <Image
                    src={mobileImg}
                    alt={slide.title}
                    fill
                    className="object-contain object-center sm:hidden"
                    sizes="94vw"
                    priority={index === 0}
                  />
                ) : null}
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 text-center sm:px-8 sm:pb-7 sm:pt-4">
              <h2 className="text-lg font-bold leading-snug sm:text-2xl">
                {slide.title}
              </h2>
              {slide.subtitle ? (
                <p className="mx-auto mt-1.5 max-w-md text-sm text-white/75 sm:text-base">
                  {slide.subtitle}
                </p>
              ) : null}

              {price != null && price > 0 && (
                <div className="mt-3 flex flex-wrap items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-white sm:text-3xl">
                    {formatEgp(price)}
                  </span>
                  {onSale && compare != null ? (
                    <span className="text-base text-white/50 line-through sm:text-lg">
                      {formatEgp(compare)}
                    </span>
                  ) : null}
                </div>
              )}

              <Link
                href={slide.href}
                className="mt-4 inline-flex w-full max-w-sm items-center justify-center rounded-xl bg-[#F5C518] px-6 py-3 text-sm font-bold text-[#14243A] shadow-md transition hover:bg-[#e6b800] sm:mt-5 sm:py-3.5 sm:text-base"
              >
                {slide.buttonText || "اطلبها الآن"}
              </Link>

              {slide.endsLabel ? (
                <p className="mt-3 text-xs text-white/55">{slide.endsLabel}</p>
              ) : null}
            </div>
          </article>

          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute right-2 top-[28%] z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#14243A] shadow-md md:grid hover:bg-white"
                aria-label="الشريحة السابقة"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute left-2 top-[28%] z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#14243A] shadow-md md:grid hover:bg-white"
                aria-label="الشريحة التالية"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {list.length > 1 && (
          <div
            className="mt-3 flex justify-center gap-2"
            role="tablist"
            aria-label="مؤشرات الحملات"
          >
            {list.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`حملة ${i + 1}`}
                onClick={() => {
                  setIndex(i);
                  setPaused(true);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "w-7 bg-[#3157D5]"
                    : "w-2 bg-[#C8D0DC] hover:bg-[#a8b2c0]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
