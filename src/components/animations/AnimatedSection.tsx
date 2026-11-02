"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { fadeInUp, staggerContainer } from "@/lib/animations/motion-variants";

type Props = {
  children: ReactNode;
  className?: string;
  /** Use stagger container for children that are AnimatedItem */
  stagger?: boolean;
  amount?: number;
  as?: "section" | "div" | "article";
  id?: string;
} & Omit<HTMLMotionProps<"section">, "children" | "initial" | "whileInView" | "viewport" | "variants">;

/**
 * Viewport entrance for page sections. Animates once by default.
 * Content stays in DOM — opacity only; never hides permanently if JS fails
 * (SSR renders at visible; client hydrates then may replay once).
 */
export function AnimatedSection({
  children,
  className,
  stagger = false,
  amount = 0.12,
  as = "section",
  id,
  ...rest
}: Props) {
  const Component = as === "div" ? motion.div : as === "article" ? motion.article : motion.section;

  return (
    <Component
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: "0px 0px -6% 0px" }}
      variants={stagger ? staggerContainer : fadeInUp}
      {...rest}
    >
      {children}
    </Component>
  );
}
