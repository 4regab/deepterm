/**
 * One spring family for the whole product (OA Design).
 * A new component borrows from this table instead of inventing an eighth curve.
 */
export const PANEL = { type: "spring", stiffness: 550, damping: 38 } as const;
export const LAYOUT = { type: "spring", stiffness: 550, damping: 40 } as const;
export const POP = { type: "spring", stiffness: 400, damping: 26 } as const;
export const POP_EXIT = { type: "spring", stiffness: 380, damping: 28 } as const;
export const BANNER = { type: "spring", stiffness: 400, damping: 30 } as const;
export const FLICK = { type: "spring", stiffness: 900, damping: 50 } as const;
export const CHART = { type: "spring", stiffness: 300, damping: 28 } as const;

/** Micro fades: 0.1s out, 0.16s in. Chrome never tweens past 0.2s. */
export const FADE_IN = { duration: 0.16, ease: "easeOut" } as const;
export const FADE_OUT = { duration: 0.1, ease: "easeOut" } as const;

/** Emil Kowalski / better-ui named curves. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const PRESS_SCALE = 0.96;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
