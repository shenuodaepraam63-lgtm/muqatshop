"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element enters the viewport.
 * More reliable than Motion whileInView inside overflow/scroll containers.
 */
export function useInViewOnce(
  options?: IntersectionObserverInit
): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    // Prefer motion if user wants reduced motion — still mark in-view immediately
    // so content is never stuck at opacity 0.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.18,
        root: options?.root ?? null,
        rootMargin: options?.rootMargin ?? "0px 0px -12% 0px",
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [inView, options?.threshold, options?.root, options?.rootMargin]);

  return [ref, inView];
}
