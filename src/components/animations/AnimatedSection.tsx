"use client";

import { motion } from "motion/react";
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
};

/**
 * Viewport entrance for page sections. Animates once by default.
 */
export function AnimatedSection({
  children,
  className,
  stagger = false,
  amount = 0.12,
  as = "section",
  id,
}: Props) {
  const variants = stagger ? staggerContainer : fadeInUp;
  const viewport = { once: true as const, amount, margin: "0px 0px -6% 0px" as const };

  if (as === "div") {
    return (
      <motion.div
        id={id}
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={variants}
      >
        {children}
      </motion.div>
    );
  }

  if (as === "article") {
    return (
      <motion.article
        id={id}
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={variants}
      >
        {children}
      </motion.article>
    );
  }

  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={variants}
    >
      {children}
    </motion.section>
  );
}
