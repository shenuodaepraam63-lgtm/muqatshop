"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { staggerItem } from "@/lib/animations/motion-variants";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
} & Omit<HTMLMotionProps<"div">, "children" | "variants">;

/** Child of AnimatedSection with stagger — or standalone fade-up item */
export function AnimatedItem({
  children,
  className,
  as = "div",
  ...rest
}: Props) {
  const Component = as === "li" ? motion.li : as === "article" ? motion.article : motion.div;

  return (
    <Component className={className} variants={staggerItem} {...rest}>
      {children}
    </Component>
  );
}
