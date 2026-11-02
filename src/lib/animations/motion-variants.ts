import type { Variants, Transition } from "motion/react";
import {
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_STAGGER,
} from "./motion-config";

const standardTransition: Transition = {
  duration: MOTION_DURATION.medium,
  ease: MOTION_EASE.standard,
};

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: MOTION_DISTANCE.medium,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: standardTransition,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATION.medium,
      ease: MOTION_EASE.standard,
    },
  },
};

export const fadeInUpSoft: Variants = {
  hidden: {
    opacity: 0,
    y: MOTION_DISTANCE.small,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: standardTransition,
  },
};

export const scaleInSoft: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: MOTION_DURATION.medium,
      ease: MOTION_EASE.standard,
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: MOTION_STAGGER.normal,
      delayChildren: 0.04,
    },
  },
};

export const staggerContainerTight: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: MOTION_STAGGER.tight,
      delayChildren: 0.02,
    },
  },
};

/** Child item used under staggerContainer */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: MOTION_DISTANCE.medium,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: standardTransition,
  },
};

export const heroText: Variants = {
  hidden: { opacity: 0, y: MOTION_DISTANCE.medium },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.medium,
      ease: MOTION_EASE.standard,
    },
  },
};

export const heroVisual: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: MOTION_DURATION.slow,
      ease: MOTION_EASE.standard,
    },
  },
};
