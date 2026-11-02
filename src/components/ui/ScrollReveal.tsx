"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger index for cascade effect */
  index?: number;
  /** Base delay between siblings (ms) */
  staggerMs?: number;
  /** How much of element must be visible (0–1) */
  threshold?: number;
  as?: "div" | "section" | "li" | "article";
};

/**
 * Fade-up when element enters the viewport (Intersection Observer).
 * Respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className = "",
  index = 0,
  staggerMs = 55,
  threshold = 0.12,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    if (mq.matches) {
      setShown(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    // Already in view on mount (above fold)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      // small timeout so first paint can be "hidden" then animate
      const t = window.setTimeout(() => setShown(true), 30 + index * staggerMs);
      return () => window.clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [index, staggerMs, threshold]);

  const style: CSSProperties = reduce
    ? undefined
    : {
        transitionDelay: shown ? `${Math.min(index, 12) * staggerMs}ms` : "0ms",
      };

  return (
    <Tag
      ref={ref as never}
      className={`scroll-reveal ${shown ? "is-visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}

/** Wraps a whole shelf/section once when it enters view */
export function ScrollRevealSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ScrollReveal as="section" className={className} index={0} staggerMs={0} threshold={0.08}>
      {children}
    </ScrollReveal>
  );
}
