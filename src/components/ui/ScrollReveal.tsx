"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  index?: number;
  /** delay step in ms */
  staggerMs?: number;
  /** Optional horizontal scroller as IntersectionObserver root */
  rootRef?: React.RefObject<HTMLElement | null>;
  as?: "div" | "section" | "li" | "article";
};

/**
 * Fade-up when element enters the viewport (or a horizontal scroller root).
 * Pure IO + CSS — reliable without depending on Motion package install timing.
 */
export function ScrollReveal({
  children,
  className = "",
  index = 0,
  staggerMs = 50,
  rootRef,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const root = rootRef?.current ?? null;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      {
        root,
        threshold: 0.15,
        rootMargin: root ? "0px" : "0px 0px -5% 0px",
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootRef]);

  const style: CSSProperties = {
    transitionDelay: visible ? `${Math.min(index, 12) * staggerMs}ms` : "0ms",
  };

  return (
    <Tag
      ref={ref as never}
      className={`mq-reveal ${visible ? "mq-reveal--in" : ""} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}

export function ScrollRevealSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ScrollReveal as="section" className={className} index={0} staggerMs={0}>
      {children}
    </ScrollReveal>
  );
}
