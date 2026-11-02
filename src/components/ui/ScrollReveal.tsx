"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger index for cascade effect */
  index?: number;
  /** Base delay between siblings (seconds) */
  stagger?: number;
  /** Fraction of element visible before trigger (0–1) */
  amount?: number;
  as?: "div" | "section" | "li" | "article";
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Smooth fade-up on scroll using Motion (whileInView).
 * Once visible, stays visible. Respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className = "",
  index = 0,
  stagger = 0.045,
  amount = 0.12,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -6% 0px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 14) * stagger,
        ease: EASE,
      }}
    >
      {children}
    </MotionTag>
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
    <ScrollReveal as="section" className={className} index={0} stagger={0} amount={0.08}>
      {children}
    </ScrollReveal>
  );
}
