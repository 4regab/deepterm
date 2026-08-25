/**
 * Shared vocabulary for the UI primitives.
 *
 * Everything here is pure and framework-free so the primitives and the tests
 * agree on one source of truth. Class strings are written out in full because
 * Tailwind only sees literals — never build them with template interpolation.
 */

export type Tone =
  | "neutral"
  | "brand"
  | "cards"
  | "reviewer"
  | "practice"
  | "success"
  | "warn"
  | "danger";

export const TONES: readonly Tone[] = [
  "neutral",
  "brand",
  "cards",
  "reviewer",
  "practice",
  "success",
  "warn",
  "danger",
];

/** Subtle fill + tinted text. The default for badges and chips. */
const TONE_SUBTLE: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-secondary",
  brand: "bg-brand-subtle text-brand-text",
  cards: "bg-cards-subtle text-cards-text",
  reviewer: "bg-reviewer-subtle text-reviewer-text",
  practice: "bg-practice-subtle text-practice-text",
  success: "bg-success-subtle text-success-text",
  warn: "bg-warn-subtle text-warn-text",
  danger: "bg-danger-subtle text-danger-text",
};

/** Solid fill + white text. Reserve for the one thing that must shout. */
const TONE_SOLID: Record<Tone, string> = {
  neutral: "bg-surface-inverse text-on-solid",
  brand: "bg-brand text-on-solid",
  cards: "bg-cards text-on-solid",
  reviewer: "bg-reviewer text-on-solid",
  practice: "bg-practice text-on-solid",
  success: "bg-success text-on-solid",
  warn: "bg-warn text-on-solid",
  danger: "bg-danger text-on-solid",
};

export function toneClasses(tone: Tone, solid = false): string {
  return solid ? TONE_SOLID[tone] : TONE_SUBTLE[tone];
}

/** Solid fill only — progress fills, rails, dots. */
export const TONE_FILL: Record<Tone, string> = {
  neutral: "bg-input", // --color-input is --border-input; `bg-border-input` is not a utility

  brand: "bg-brand",
  cards: "bg-cards",
  reviewer: "bg-reviewer",
  practice: "bg-practice",
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
};

/* -------------------------------------------------------------------------- */
/* Content types                                                              */
/* -------------------------------------------------------------------------- */

export type ContentType = "Flashcards" | "Reviewer" | "Practice";

export const CONTENT_TYPES: readonly ContentType[] = [
  "Flashcards",
  "Reviewer",
  "Practice",
];

export interface ContentTypeTokens {
  /** The tone this content type borrows for badges and progress fills. */
  tone: Tone;
  /** Rounded-square tile: subtle fill, tinted glyph. */
  tile: string;
  /** 3px left rail on an accent card. */
  rail: string;
  label: string;
}

const CONTENT_TYPE_TOKENS: Record<ContentType, ContentTypeTokens> = {
  Flashcards: {
    tone: "cards",
    tile: "bg-cards-subtle text-cards-text",
    rail: "border-l-cards",
    label: "Flashcards",
  },
  Reviewer: {
    tone: "reviewer",
    tile: "bg-reviewer-subtle text-reviewer-text",
    rail: "border-l-reviewer",
    label: "Reviewer",
  },
  Practice: {
    tone: "practice",
    tile: "bg-practice-subtle text-practice-text",
    rail: "border-l-practice",
    label: "Practice",
  },
};

export function contentTypeTokens(type: ContentType): ContentTypeTokens {
  return CONTENT_TYPE_TOKENS[type];
}

/* -------------------------------------------------------------------------- */
/* Field wiring                                                               */
/* -------------------------------------------------------------------------- */

export interface FieldIds {
  controlId: string;
  descriptionId: string;
  errorId: string;
  /** What the control's aria-describedby should be, or undefined for none. */
  describedBy: string | undefined;
  invalid: boolean;
}

/**
 * Resolves the id wiring for a Field. An error always wins over a description
 * for screen readers, but both are announced when both are present.
 */
export function fieldIds(
  baseId: string,
  options: { hasDescription?: boolean; hasError?: boolean } = {}
): FieldIds {
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const parts: string[] = [];
  if (options.hasError) parts.push(errorId);
  if (options.hasDescription) parts.push(descriptionId);
  return {
    controlId: baseId,
    descriptionId,
    errorId,
    describedBy: parts.length > 0 ? parts.join(" ") : undefined,
    invalid: Boolean(options.hasError),
  };
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

export interface StudyCounts {
  new: number;
  learning: number;
  mastered: number;
}

export interface SegmentedProgressWidths extends StudyCounts {
  total: number;
}

/**
 * Proportional widths (percent) for the three study states. Returns zeros when
 * there is nothing to show so the caller can render an empty track instead of
 * dividing by zero. Negative counts are clamped — a corrupt row should not be
 * able to invert the bar.
 */
export function segmentedProgressWidths(counts: StudyCounts): SegmentedProgressWidths {
  const fresh = Math.max(0, counts.new);
  const learning = Math.max(0, counts.learning);
  const mastered = Math.max(0, counts.mastered);
  const total = fresh + learning + mastered;
  if (total === 0) {
    return { new: 0, learning: 0, mastered: 0, total: 0 };
  }
  return {
    new: (fresh / total) * 100,
    learning: (learning / total) * 100,
    mastered: (mastered / total) * 100,
    total,
  };
}

/** Clamps a progress value into its track and returns a 0–100 percentage. */
export function progressPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export type StepState = "complete" | "current" | "upcoming";

export function stepState(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "current";
  return "upcoming";
}

/* -------------------------------------------------------------------------- */
/* Empty states                                                               */
/* -------------------------------------------------------------------------- */

export type EmptyStateVariant = "empty" | "no-results" | "error";

export interface EmptyStateTokens {
  /** Tone of the icon medallion. */
  tone: Tone;
  /** aria role for the region — an error is announced, an empty list is not. */
  role: "status" | "alert" | undefined;
}

const EMPTY_STATE_TOKENS: Record<EmptyStateVariant, EmptyStateTokens> = {
  empty: { tone: "neutral", role: undefined },
  "no-results": { tone: "neutral", role: "status" },
  error: { tone: "danger", role: "alert" },
};

export function emptyStateTokens(variant: EmptyStateVariant): EmptyStateTokens {
  return EMPTY_STATE_TOKENS[variant];
}

/* -------------------------------------------------------------------------- */
/* Segmented control                                                          */
/* -------------------------------------------------------------------------- */

/** Past four options a segmented control stops being scannable — use a Select. */
export const MAX_SEGMENTS = 4;

/** Arrow-key movement inside a roving-tabindex group. Wraps at both ends. */
export function nextRovingIndex(
  current: number,
  count: number,
  key: "ArrowLeft" | "ArrowRight" | "Home" | "End"
): number {
  if (count <= 0) return 0;
  switch (key) {
    case "ArrowLeft":
      return (current - 1 + count) % count;
    case "ArrowRight":
      return (current + 1) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
  }
}
