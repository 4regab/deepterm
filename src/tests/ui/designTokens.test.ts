import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(
  join(import.meta.dir, "..", "..", "styles", "globals.css"),
  "utf8"
);
const layout = readFileSync(
  join(import.meta.dir, "..", "..", "app", "layout.tsx"),
  "utf8"
);

describe("colour tokens", () => {
  const expected: Record<string, string> = {
    "--canvas": "#f5f6f8",
    "--surface": "#ffffff",
    "--surface-sunken": "#eef0f4",
    "--surface-hover": "#f1f3f7",
    "--surface-inverse": "#171d2b",
    "--border-subtle": "#edeff3",
    "--border": "#dfe3ea",
    "--border-input": "#8c95a8",
    "--border-strong": "#171d2b",
    "--text": "#10141f",
    "--text-secondary": "#4a5264",
    "--text-muted": "#5e6779",
    "--text-disabled": "#9aa1b0",
    "--brand": "#4f46e5",
    "--brand-hover": "#4338ca",
    "--brand-active": "#3730a3",
    "--brand-subtle": "#eef0fe",
    "--brand-text": "#3730a3",
    "--focus": "#4f46e5",
    "--type-cards": "#0e7490",
    "--type-reviewer": "#b45309",
    "--type-practice": "#6d28d9",
    "--success": "#047857",
    "--warn": "#b45309",
    "--danger": "#b91c1c",
  };

  for (const [token, value] of Object.entries(expected)) {
    it(`defines ${token}`, () => {
      expect(css).toContain(`${token}: ${value};`);
    });
  }

  it("documents the warn / reviewer collision rule", () => {
    expect(css).toContain("COLLISION RULE");
    expect(css).toContain("AlertTriangle");
    expect(css).toContain("BookOpen");
  });
});

describe("scales", () => {
  it("ships a 4px spacing scale from 4 to 80", () => {
    expect(css).toContain("--space-1: 4px;");
    expect(css).toContain("--space-4: 16px;");
    expect(css).toContain("--space-20: 80px;");
  });

  it("caps the radius scale at 16px", () => {
    expect(css).toContain("--radius-xs: 6px;");
    expect(css).toContain("--radius-sm: 8px;");
    expect(css).toContain("--radius-md: 12px;");
    expect(css).toContain("--radius-lg: 16px;");
  });

  it("rests cards at elevation zero", () => {
    expect(css).toContain("--elev-0: none;");
    expect(css).toContain("--elev-1: 0 1px 2px rgba(16, 20, 31, 0.06);");
  });

  it("ships the four durations and four curves", () => {
    for (const token of ["--dur-instant", "--dur-fast", "--dur-base", "--dur-slow"]) {
      expect(css).toContain(`${token}:`);
    }
    for (const token of ["--ease-out", "--ease-in", "--ease-in-out", "--ease-spring"]) {
      expect(css).toContain(`${token}:`);
    }
  });

  it("neutralises durations under prefers-reduced-motion", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("--dur-base: 0ms;");
  });
});

describe("backward compatibility", () => {
  const legacyTokens = [
    "--background",
    "--card",
    "--popover",
    "--foreground",
    "--muted-foreground",
    "--primary",
    "--primary-foreground",
    "--accent",
    "--muted",
    "--secondary",
    "--input",
    "--ring",
    "--ink",
    "--destructive",
    "--success",
    "--warning",
    "--info",
    "--radius",
    "--shadow-resting",
    "--shadow-floating",
  ];

  for (const token of legacyTokens) {
    it(`keeps ${token} defined for page files`, () => {
      expect(css).toMatch(new RegExp(`\\${token}:\\s`));
    });
  }

  const legacyClasses = [
    ".plate {",
    ".pressable {",
    ".hover-lift:hover {",
    ".reveal {",
    ".tabular {",
    ".skip-link {",
    ".header-pill {",
    ".skeleton-bar {",
    ".oa-arrive {",
    ".faq-panel {",
    ".source-serif-4 {",
  ];

  for (const className of legacyClasses) {
    it(`keeps ${className.replace(" {", "")} available`, () => {
      expect(css).toContain(className);
    });
  }

  it("drops .squircle, which had no callers left", () => {
    expect(css).not.toContain("squircle");
  });

  const legacyUtilities = [
    "--color-background",
    "--color-foreground",
    "--color-card",
    "--color-popover",
    "--color-border",
    "--color-input",
    "--color-accent",
    "--color-muted-foreground",
    "--color-primary",
    "--color-primary-foreground",
    "--color-ring",
    "--color-destructive",
    "--color-success-foreground",
    "--color-warning",
    "--color-info",
    "--font-sans",
    "--font-serif",
    "--font-sora",
  ];

  for (const utility of legacyUtilities) {
    it(`keeps the ${utility} utility mapping`, () => {
      expect(css).toContain(`${utility}: var(`);
    });
  }

  it("keeps bg-muted a surface even though text-muted is a text role", () => {
    expect(css).toContain("@utility bg-muted");
    expect(css).toContain("@utility text-muted");
  });
});

describe("typography", () => {
  const scale: Record<string, [number, number]> = {
    "display-lg": [40, 44],
    display: [32, 38],
    "title-lg": [24, 30],
    title: [20, 28],
    subtitle: [16, 24],
    body: [15, 22],
    "body-strong": [15, 22],
    "body-sm": [13, 18],
    label: [13, 16],
    caption: [12, 16],
    overline: [11, 14],
  };

  for (const [name, [size, leading]] of Object.entries(scale)) {
    it(`defines .${name} at ${size}/${leading}`, () => {
      const block = css.slice(css.indexOf(`.${name} {`));
      expect(css).toContain(`.${name} {`);
      expect(block.slice(0, 200)).toContain(`font-size: ${size}px;`);
      expect(block.slice(0, 200)).toContain(`line-height: ${leading}px;`);
    });
  }

  it("keeps the 16px mobile input rule that stops iOS zooming", () => {
    expect(css).toContain("font-size: 1rem;");
    expect(css).toContain("@media (min-width: 640px)");
  });

  it("keeps the text-wrap rules", () => {
    expect(css).toContain("text-wrap: balance;");
    expect(css).toContain("text-wrap: pretty;");
  });

  it("offers tabular numerals for stats and counters", () => {
    expect(css).toContain("font-variant-numeric: tabular-nums;");
  });
});

describe("fonts", () => {
  it("loads Geist for UI and Source Serif for reading", () => {
    expect(layout).toContain("Geist");
    expect(layout).toContain("Source_Serif_4");
    expect(layout).toContain('variable: "--font-geist"');
  });

  it("drops Space Grotesk and Sora", () => {
    expect(layout).not.toContain("Space_Grotesk");
    expect(layout).not.toContain("Sora");
  });

  it("keeps the html hydration and colour-scheme hooks for a later dark mode", () => {
    expect(layout).toContain("suppressHydrationWarning");
    expect(layout).toContain('name="color-scheme"');
  });
});
