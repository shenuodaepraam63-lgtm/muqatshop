"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type PromoSlide = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  image?: string | null;
  tone?: "navy" | "blue" | "teal";
};

const TONES: Record<string, string> = {
  navy: "from-[#14243A] to-[#1e3554]",
  blue: "from-[#3157D5] to-[#2447B8]",
  teal: "from-[#18A999] to-[#128a7d]",
};

export function PromoSlider({ slides }: { slides: PromoSlide[] }) {
  const list = slides.slice(0, 3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (list.length <= 1) return;
      setIndex((i) => (i + dir + list.length) % list.length);
      setPaused(true);
    },
    [list.length]
  );

  useEffect(() => {
    if (list.length <= 1 || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [list.length, paused]);

  useEffect(() => {
    if (!paused) return;
    const t = window.setTimeout(() => setPaused(false), 8000);
    return () => window.clearTimeout(t);
  }, [paused, index]);

  if (!list.length) return null;

  const slide = list[index];

  return (
    <section className="home-section" aria-label="عروض المنصة">
      <div className="home-container relative">
        <div
          className="relative overflow-hidden rounded-[16px] max-md:rounded-[12px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Link
            href={slide.href}
            className={`relative flex h-[240px] items-center max-md:h-[150px] bg-gradient-to-l ${
              TONES[slide.tone || "navy"]
            }`}
          >
            {slide.image ? (
              <Image
                src={slide.image}
                alt=""
                fill
                className="object-cover opacity-40"
                sizes="(max-width:767px) 94vw, 92vw"
                priority={index === 0}
              />
            ) : null}
            <div className="relative z-10 px-6 sm:px-10 max-w-xl text-white">
              <p className="text-lg font-bold sm:text-2xl leading-snug line-clamp-2">{slide.title}</p>
              {slide.subtitle ? (
                <p className="mt-2 text-sm text-white/85 line-clamp-2 max-md:text-xs">{slide.subtitle}</p>
              ) : null}
              <span className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#14243A] max-md:mt-3 max-md:text-xs">
                تصفح الآن
              </span>
            </div>
          </Link>

          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#14243A] shadow md:grid"
                aria-label="السابق"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#14243A] shadow md:grid"
                aria-label="التالي"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {list.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {list.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`بانر ${i + 1}`}
                onClick={() => {
                  setIndex(i);
                  setPaused(true);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-[#3157D5]" : "w-2 bg-[#C8D0DC]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
