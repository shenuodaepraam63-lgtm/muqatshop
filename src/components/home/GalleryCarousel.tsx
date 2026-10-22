"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

export type GallerySlide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
};

type GallerySettings = {
  enabled?: boolean;
  template?: "rounded_carousel" | "fade" | "peek" | "full";
  autoplay?: boolean;
  interval_ms?: number;
};

type Props = {
  slides: GallerySlide[];
  settings?: GallerySettings;
};

export function GalleryCarousel({ slides, settings }: Props) {
  const enabled = settings?.enabled !== false;
  const template = settings?.template || "rounded_carousel";
  const autoplay = settings?.autoplay !== false;
  const interval = settings?.interval_ms || 4000;

  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const count = slides.length;

  const go = useCallback(
    (dir: number) => {
      if (count === 0) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!autoplay || count < 2) return;
    const t = setInterval(() => go(1), interval);
    return () => clearInterval(t);
  }, [autoplay, interval, count, go, index]);

  if (!enabled || count === 0) return null;

  const slide = slides[index];

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart == null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(dx) > 40) {
      // RTL: swipe right (positive) = previous visually? In RTL, swipe left shows next
      if (dx < 0) go(1);
      else go(-1);
    }
    setTouchStart(null);
  };

  const media = (
    <div className="relative w-full h-full">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100 z-[1]" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={s.image_url}
            alt={s.title || "معرض"}
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
          {(s.title || s.subtitle) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10 text-white">
              {s.title && (
                <p className="text-xl md:text-3xl font-bold drop-shadow">{s.title}</p>
              )}
              {s.subtitle && (
                <p className="text-sm md:text-base opacity-90 mt-1">{s.subtitle}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const dots = count > 1 && (
    <div className="flex justify-center gap-2 mt-3">
      {slides.map((s, i) => (
        <button
          key={s.id}
          type="button"
          aria-label={`شريحة ${i + 1}`}
          onClick={() => setIndex(i)}
          className={`h-1.5 rounded-full transition-all ${
            i === index ? "w-6 bg-ink" : "w-1.5 bg-ink/30"
          }`}
        />
      ))}
    </div>
  );

  const wrapLink = (node: React.ReactNode) =>
    slide.link_url ? (
      <Link href={slide.link_url} className="block h-full w-full">
        {node}
      </Link>
    ) : (
      node
    );

  // Template: rounded_carousel — like Elvora video
  if (template === "rounded_carousel" || template === "fade") {
    return (
      <section className="w-full px-4 md:px-8 pt-3 md:pt-5">
        <div
          className="max-w-page mx-auto"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9] overflow-hidden rounded-2xl md:rounded-3xl bg-[#ebe6dc] shadow-sm">
            {wrapLink(media)}
          </div>
          {dots}
        </div>
      </section>
    );
  }

  // Template: peek — side peek of next slides
  if (template === "peek") {
    return (
      <section className="w-full pt-3 md:pt-5 overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(${index * 100}%)`, // RTL flip via direction
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {slides.map((s) => (
            <div key={s.id} className="w-full shrink-0 px-4 md:px-8">
              <div className="relative aspect-[4/5] sm:aspect-[16/10] overflow-hidden rounded-2xl bg-[#ebe6dc]">
                <Image src={s.image_url} alt={s.title || ""} fill className="object-cover" sizes="100vw" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-4">{dots}</div>
      </section>
    );
  }

  // Template: full — edge to edge
  return (
    <section className="w-full pt-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="relative aspect-[4/5] sm:aspect-[16/9] bg-[#ebe6dc]">{wrapLink(media)}</div>
      <div className="px-4">{dots}</div>
    </section>
  );
}
