"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

type Props = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: Props) {
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
    // RTL: swipe left (negative) → next, swipe right → prev
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

  return (
    <div className="min-w-0 w-full">
      {/* Main image */}
      <div
        className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden bg-[#ebe6dc] mb-3 select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            className="object-cover pointer-events-none"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            لا صورة
          </div>
        )}

        {/* Zoom */}
        {current && (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center z-10"
            aria-label="تكبير"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 shadow-md flex items-center justify-center z-10 active:scale-95 transition"
              aria-label="السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 shadow-md flex items-center justify-center z-10 active:scale-95 transition"
              aria-label="التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
              {list.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/35"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {list.length > 1 && (
        <div className="flex min-w-0 w-full max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none">
          {list.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-[#ebe6dc] ring-2 transition ${
                active === i ? "ring-ink" : "ring-transparent opacity-75"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {lightbox && current && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium truncate">
              {active + 1} / {list.length} — {name}
            </span>
            <button type="button" onClick={() => setLightbox(false)} aria-label="إغلاق">
              <X className="w-7 h-7" />
            </button>
          </div>
          <div
            className="relative flex-1 flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {list.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
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
          {list.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-6">
              {list.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
