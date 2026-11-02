/** Shared motion tokens — Muqatshop Global Animation System */

export const MOTION_DURATION = {
  fast: 0.15,
  normal: 0.25,
  medium: 0.4,
  slow: 0.55,
} as const;

export const MOTION_EASE = {
  /** Premium ease-out for entrances */
  standard: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;

export const MOTION_DISTANCE = {
  micro: 4,
  small: 10,
  medium: 18,
  large: 26,
} as const;

export const MOTION_STAGGER = {
  tight: 0.04,
  normal: 0.06,
  relaxed: 0.08,
} as const;

/** Cap how many children get individual stagger delays */
export const MOTION_STAGGER_MAX = 10;
