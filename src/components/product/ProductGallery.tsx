"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: Props) {
  const list = images.length ? images : [];
  const [active, setActive] = useState(0);
  const [storyOpen, setStoryOpen] = useState(false);
  const current = list[active] || list[0];

  const prev = useCallback(() => {
    if (!list.length) return;
    setActive((i) => (i - 1 + list.length) % list.length);
  }, [list.length]);

  const next = useCallback(() => {
    if (!list.length) return;
    setActive((i) => (i + 1) % list.length);
  }, [list.length]);

  useEffect(() => {
    if (!storyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStoryOpen(false);
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [storyOpen, next, prev]);

  useEffect(() => {
    if (!storyOpen || list.length < 2) return;
    const t = setTimeout(() => next(), 4000);
    return () => clearTimeout(t);
  }, [storyOpen, active, list.length, next]);

  return (
    <div>
      <div className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden bg-[#ebe6dc] mb-3 group">
        {current ? (
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setStoryOpen(true)}
            aria-label="فتح الصور"
          >
            <Image
              src={current}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </button>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            لا صورة
          </div>
        )}

        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition z-10"
              aria-label="السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition z-10"
              aria-label="التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
              {list.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition ${
                    i === active ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {list.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square rounded-xl overflow-hidden bg-[#ebe6dc] ring-2 transition ${
                active === i
                  ? "ring-ink"
                  : "ring-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="100px" />
            </button>
          ))}
        </div>
      )}

      {storyOpen && current && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {list.length > 1 && (
            <div className="flex gap-1 px-3 pt-3 pb-2">
              {list.map((_, i) => (
                <div key={i} className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className={`h-full bg-white ${
                      i < active
                        ? "w-full"
                        : i === active
                          ? "story-progress-active"
                          : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-2 text-white">
            <span className="text-sm font-medium truncate">{name}</span>
            <button type="button" onClick={() => setStoryOpen(false)} aria-label="إغلاق">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center">
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/3 z-10"
              onClick={prev}
              aria-label="السابق"
            />
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/3 z-10"
              onClick={next}
              aria-label="التالي"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={list[active]}
              alt={name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
