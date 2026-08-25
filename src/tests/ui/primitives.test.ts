import { describe, expect, it } from "bun:test";
import {
  CONTENT_TYPES,
  MAX_SEGMENTS,
  TONES,
  contentTypeTokens,
  emptyStateTokens,
  fieldIds,
  nextRovingIndex,
  progressPercent,
  segmentedProgressWidths,
  stepState,
  toneClasses,
  type Tone,
} from "../../components/ui/tokens";

describe("Field wiring", () => {
  it("describes nothing when there is nothing to describe", () => {
    const ids = fieldIds("email");
    expect(ids.describedBy).toBeUndefined();
    expect(ids.invalid).toBe(false);
  });

  it("points aria-describedby at the description id", () => {
    const ids = fieldIds("email", { hasDescription: true });
    expect(ids.describedBy).toBe("email-description");
    expect(ids.invalid).toBe(false);
  });

  it("marks the control invalid and points at the error id", () => {
    const ids = fieldIds("email", { hasError: true });
    expect(ids.describedBy).toBe("email-error");
    expect(ids.invalid).toBe(true);
  });

  it("announces the error before the description when both exist", () => {
    const ids = fieldIds("email", { hasDescription: true, hasError: true });
    expect(ids.describedBy).toBe("email-error email-description");
    expect(ids.invalid).toBe(true);
  });

  it("keeps every generated id under the same base", () => {
    const ids = fieldIds("deck-title");
    expect(ids.controlId).toBe("deck-title");
    expect(ids.descriptionId.startsWith("deck-title")).toBe(true);
    expect(ids.errorId.startsWith("deck-title")).toBe(true);
    expect(ids.descriptionId).not.toBe(ids.errorId);
  });
});

describe("SegmentedProgress proportions", () => {
  it("splits the track in proportion to the counts", () => {
    const widths = segmentedProgressWidths({ new: 1, learning: 1, mastered: 2 });
    expect(widths.new).toBe(25);
    expect(widths.learning).toBe(25);
    expect(widths.mastered).toBe(50);
    expect(widths.total).toBe(4);
  });

  it("always fills the whole track", () => {
    const widths = segmentedProgressWidths({ new: 7, learning: 11, mastered: 13 });
    expect(widths.new + widths.learning + widths.mastered).toBeCloseTo(100, 10);
  });

  it("gives one state the full width when it is the only state", () => {
    const widths = segmentedProgressWidths({ new: 0, learning: 0, mastered: 9 });
    expect(widths.mastered).toBe(100);
    expect(widths.new).toBe(0);
    expect(widths.learning).toBe(0);
  });

  it("returns an empty track instead of dividing by zero", () => {
    const widths = segmentedProgressWidths({ new: 0, learning: 0, mastered: 0 });
    expect(widths).toEqual({ new: 0, learning: 0, mastered: 0, total: 0 });
  });

  it("clamps negative counts so a bad row cannot invert the bar", () => {
    const widths = segmentedProgressWidths({ new: -5, learning: 1, mastered: 1 });
    expect(widths.new).toBe(0);
    expect(widths.total).toBe(2);
    expect(widths.learning + widths.mastered).toBeCloseTo(100, 10);
  });
});

describe("progressPercent", () => {
  it("converts a value into a percentage of its max", () => {
    expect(progressPercent(25, 50)).toBe(50);
  });

  it("clamps to the track at both ends", () => {
    expect(progressPercent(-10, 50)).toBe(0);
    expect(progressPercent(80, 50)).toBe(100);
  });

  it("returns zero for an unusable max rather than Infinity or NaN", () => {
    expect(progressPercent(5, 0)).toBe(0);
    expect(progressPercent(5, Number.NaN)).toBe(0);
    expect(progressPercent(Number.NaN, 10)).toBe(0);
  });
});

describe("StepIndicator states", () => {
  it("marks earlier steps complete, the index current, later upcoming", () => {
    expect(stepState(0, 1)).toBe("complete");
    expect(stepState(1, 1)).toBe("current");
    expect(stepState(2, 1)).toBe("upcoming");
  });

  it("has no complete steps on the first step", () => {
    const states = [0, 1, 2].map((index) => stepState(index, 0));
    expect(states).toEqual(["current", "upcoming", "upcoming"]);
  });

  it("has no upcoming steps on the last step", () => {
    const states = [0, 1, 2].map((index) => stepState(index, 2));
    expect(states).toEqual(["complete", "complete", "current"]);
  });

  it("shows every step complete once current runs past the end", () => {
    const states = [0, 1, 2].map((index) => stepState(index, 3));
    expect(states).toEqual(["complete", "complete", "complete"]);
  });
});

describe("EmptyState variants", () => {
  it("keeps an empty list silent for assistive tech", () => {
    expect(emptyStateTokens("empty")).toEqual({ tone: "neutral", role: undefined });
  });

  it("announces a filter that matched nothing politely", () => {
    expect(emptyStateTokens("no-results").role).toBe("status");
  });

  it("announces a failed load assertively and tones it danger", () => {
    expect(emptyStateTokens("error")).toEqual({ tone: "danger", role: "alert" });
  });

  it("only the error variant uses the danger tone", () => {
    const danger = (["empty", "no-results", "error"] as const).filter(
      (variant) => emptyStateTokens(variant).tone === "danger"
    );
    expect(danger).toEqual(["error"]);
  });
});

describe("Badge and Chip tone mapping", () => {
  it("pairs every subtle fill with its matching text token", () => {
    for (const tone of TONES) {
      if (tone === "neutral") continue;
      const classes = toneClasses(tone);
      expect(classes).toContain(`bg-${tone}-subtle`);
      expect(classes).toContain(`text-${tone}-text`);
    }
  });

  it("pairs every solid fill with on-solid text", () => {
    for (const tone of TONES) {
      if (tone === "neutral") continue;
      const classes = toneClasses(tone, true);
      expect(classes).toBe(`bg-${tone} text-on-solid`);
    }
  });

  it("falls back to surface tokens for the neutral tone", () => {
    expect(toneClasses("neutral")).toBe("bg-surface-sunken text-secondary");
    expect(toneClasses("neutral", true)).toBe("bg-surface-inverse text-on-solid");
  });

  it("never emits a raw Tailwind palette colour", () => {
    const palette = /\b(bg|text|border)-(red|green|blue|gray|slate|zinc|amber|yellow)-\d{2,3}\b/;
    for (const tone of TONES) {
      expect(toneClasses(tone)).not.toMatch(palette);
      expect(toneClasses(tone, true)).not.toMatch(palette);
    }
  });

  it("gives every tone a distinct subtle recipe", () => {
    const recipes = new Set(TONES.map((tone: Tone) => toneClasses(tone)));
    expect(recipes.size).toBe(TONES.length);
  });
});

describe("Content types", () => {
  it("gives each content type its own hue family", () => {
    const tones = CONTENT_TYPES.map((type) => contentTypeTokens(type).tone);
    expect(tones).toEqual(["cards", "reviewer", "practice"]);
    expect(new Set(tones).size).toBe(3);
  });

  it("labels each type with the name the product uses", () => {
    expect(contentTypeTokens("Flashcards").label).toBe("Flashcards");
    expect(contentTypeTokens("Reviewer").label).toBe("Reviewer");
    expect(contentTypeTokens("Practice").label).toBe("Practice");
  });

  it("routes rails and tiles through the same hue as the tone", () => {
    for (const type of CONTENT_TYPES) {
      const tokens = contentTypeTokens(type);
      expect(tokens.rail).toBe(`border-l-${tokens.tone}`);
      expect(tokens.tile).toContain(`bg-${tokens.tone}-subtle`);
    }
  });
});

describe("Roving tabindex", () => {
  it("wraps at both ends", () => {
    expect(nextRovingIndex(0, 3, "ArrowLeft")).toBe(2);
    expect(nextRovingIndex(2, 3, "ArrowRight")).toBe(0);
  });

  it("steps one option at a time", () => {
    expect(nextRovingIndex(0, 3, "ArrowRight")).toBe(1);
    expect(nextRovingIndex(2, 3, "ArrowLeft")).toBe(1);
  });

  it("jumps to the ends with Home and End", () => {
    expect(nextRovingIndex(1, 4, "Home")).toBe(0);
    expect(nextRovingIndex(1, 4, "End")).toBe(3);
  });

  it("does not go out of bounds on an empty group", () => {
    expect(nextRovingIndex(0, 0, "ArrowRight")).toBe(0);
  });

  it("caps a segmented control at four options", () => {
    expect(MAX_SEGMENTS).toBe(4);
  });
});
