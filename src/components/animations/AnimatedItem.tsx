"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { staggerItem } from "@/lib/animations/motion-variants";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
};

/** Child of AnimatedSection with stagger — or standalone fade-up item */
export function AnimatedItem({ children, className, as = "div" }: Props) {
  if (as === "li") {
    return (
      <motion.li className={className} variants={staggerItem}>
        {children}
      </motion.li>
    );
  }
  if (as === "article") {
    return (
      <motion.article className={className} variants={staggerItem}>
        {children}
      </motion.article>
    );
  }
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
