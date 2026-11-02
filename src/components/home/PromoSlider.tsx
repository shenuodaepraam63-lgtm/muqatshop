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
};

const TONES: Record<string, string> = {
  navy: "from-[#14243A] via-[#1a2f4a] to-[#0f1c2e]",
  blue: "from-[#3157D5] to-[#1e3a9a]",
  teal: "from-[#18A999] to-[#0f7a6e]",
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
        : (c as PromoSlide).buttonText || "تصفح الآن",
    tone: (c as PromoSlide).tone,
  };
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

  return (
    <section className="home-section" aria-roledescription="carousel" aria-label="الحملات الإعلانية">
      <div className="home-container relative">
        <div
          className="relative overflow-hidden rounded-[20px] max-md:rounded-[14px] shadow-[0_8px_30px_rgba(20,36,58,0.12)]"
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
            // RTL: swipe right → previous visual, left → next
            go(dx > 0 ? -1 : 1);
          }}
        >
          <Link
            href={slide.href}
            className={`relative flex h-[200px] sm:h-[320px] md:h-[400px] lg:h-[440px] items-stretch overflow-hidden bg-gradient-to-l ${
              TONES[slide.tone || "navy"]
            }`}
          >
            {/* Desktop image */}
            {desktopImg ? (
              <Image
                src={desktopImg}
                alt={slide.title}
                fill
                className="hidden sm:block object-cover"
                sizes="(max-width:1024px) 92vw, 1200px"
                priority={index === 0}
              />
            ) : null}
            {/* Mobile image */}
            {mobileImg ? (
              <Image
                src={mobileImg}
                alt={slide.title}
                fill
                className="sm:hidden object-cover"
                sizes="94vw"
                priority={index === 0}
              />
            ) : null}

            {/* Readable overlay */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/55 via-black/25 to-transparent sm:from-black/45 sm:via-black/15" />

            <div className="relative z-10 flex flex-col justify-center px-5 sm:px-10 md:px-14 max-w-xl text-white py-6">
              <p className="text-lg font-bold sm:text-2xl md:text-3xl leading-snug line-clamp-2 drop-shadow-sm">
                {slide.title}
              </p>
              {slide.subtitle ? (
                <p className="mt-2 text-sm text-white/90 line-clamp-2 max-md:text-xs max-w-md">
                  {slide.subtitle}
                </p>
              ) : null}
              <span className="mt-4 inline-flex w-fit items-center rounded-xl bg-[#22c55e] hover:bg-[#16a34a] px-5 py-2.5 text-sm font-bold text-white shadow-md transition max-md:mt-3 max-md:text-xs max-md:px-4 max-md:py-2">
                {slide.buttonText || "تصفح الآن"}
              </span>
            </div>
          </Link>

          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#14243A] shadow-md md:grid hover:bg-white transition"
                aria-label="الشريحة السابقة"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#14243A] shadow-md md:grid hover:bg-white transition"
                aria-label="الشريحة التالية"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {list.length > 1 && (
          <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="مؤشرات الحملات">
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
                  i === index ? "w-7 bg-[#3157D5]" : "w-2 bg-[#C8D0DC] hover:bg-[#a8b2c0]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
