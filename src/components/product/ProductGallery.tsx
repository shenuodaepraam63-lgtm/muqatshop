"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  images: string[];
  name: string;
  badges?: { label: string; tone?: "sale" | "new" | "out" }[];
};

export function ProductGallery({ images, name, badges = [] }: Props) {
  const list = images.length ? images : [];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);
  const current = list[active] || list[0];

  const prev = useCallback(() => {
    if (!list.length) return;
    setActive((i) => (i - 1 + list.length) % list.length);
  }, [list.length]);

  const next = useCallback(() => {
    if (!list.length) return;
    setActive((i) => (i + 1) % list.length);
  }, [list.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 45) {
      if (dx < 0) next();
      else prev();
    }
    touchX.current = null;
  };

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, next, prev]);

  const visibleBadges = badges.slice(0, 2);

  return (
    <div className="min-w-0 w-full">
      <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-2.5">
        {/* Main */}
        <div
          className="relative aspect-square w-full flex-1 overflow-hidden rounded-[12px] border border-[#E5EAF1] bg-white sm:rounded-[16px]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {current ? (
            <button
              type="button"
              className="absolute inset-0 z-[1]"
              onClick={() => setLightbox(true)}
              aria-label="عرض الصورة بحجم كامل"
            >
              <Image
                src={current}
                alt={name}
                fill
                className="object-contain p-3 pointer-events-none"
                sizes="(max-width: 768px) 94vw, 42vw"
                priority
                draggable={false}
              />
            </button>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-[#718096]">
              لا صورة
            </div>
          )}

          {visibleBadges.length > 0 && (
            <div className="absolute right-2 top-2 z-[2] flex flex-col gap-1">
              {visibleBadges.map((b) => (
                <span
                  key={b.label}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold text-white ${
                    b.tone === "out"
                      ? "bg-[#14243A]/85"
                      : b.tone === "sale"
                        ? "bg-[#DC3545]"
                        : "bg-[#3157D5]"
                  }`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute right-2 top-1/2 z-[2] hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#E5EAF1] bg-white/95 shadow sm:grid"
                aria-label="السابق"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute left-2 top-1/2 z-[2] hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#E5EAF1] bg-white/95 shadow sm:grid"
                aria-label="التالي"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="absolute bottom-2 left-1/2 z-[2] -translate-x-1/2 rounded-full bg-[#14243A]/75 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {active + 1} / {list.length}
              </p>
            </>
          )}
        </div>

        {/* Thumbs — vertical on desktop, horizontal on mobile */}
        {list.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:max-h-[520px] lg:w-[76px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
            {list.map((url, i) => (
              <button
                key={url + i}
                type="button"
                onClick={() => setActive(i)}
                className={`relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[10px] border-2 bg-[#F6F8FB] sm:h-[76px] sm:w-[76px] ${
                  active === i ? "border-[#3157D5]" : "border-[#E5EAF1]"
                }`}
              >
                <Image src={url} alt="" fill className="object-contain p-1" sizes="76px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && current && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="truncate text-sm font-medium">
              {active + 1} / {list.length} — {name}
            </span>
            <button type="button" onClick={() => setLightbox(false)} aria-label="إغلاق">
              <X className="h-7 w-7" />
            </button>
          </div>
          <div
            className="relative flex flex-1 items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {list.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
                  aria-label="السابق"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
                  aria-label="التالي"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={list[active]}
              alt={name}
              className="max-h-[85vh] max-w-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
