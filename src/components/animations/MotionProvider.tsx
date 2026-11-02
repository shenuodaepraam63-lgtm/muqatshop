"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { MOTION_EASE } from "@/lib/animations/motion-config";

/**
 * Global Motion preferences: reduced-motion + default transition.
 * Wraps the app tree without changing layout.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        duration: 0.4,
        ease: MOTION_EASE.standard,
      }}
    >
      {children}
    </MotionConfig>
  );
}
