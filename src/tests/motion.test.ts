import { describe, expect, it } from "bun:test";
import {
  BANNER,
  CHART,
  EASE_OUT,
  FADE_IN,
  FADE_OUT,
  FLICK,
  LAYOUT,
  PANEL,
  POP,
  POP_EXIT,
  PRESS_SCALE,
} from "../lib/motion";

describe("motion vocabulary", () => {
  it("exposes the seven OA springs", () => {
    expect(PANEL).toEqual({ type: "spring", stiffness: 550, damping: 38 });
    expect(LAYOUT).toEqual({ type: "spring", stiffness: 550, damping: 40 });
    expect(POP).toEqual({ type: "spring", stiffness: 400, damping: 26 });
    expect(POP_EXIT).toEqual({ type: "spring", stiffness: 380, damping: 28 });
    expect(BANNER).toEqual({ type: "spring", stiffness: 400, damping: 30 });
    expect(FLICK).toEqual({ type: "spring", stiffness: 900, damping: 50 });
    expect(CHART).toEqual({ type: "spring", stiffness: 300, damping: 28 });
  });

  it("keeps chrome fades under 200ms with ease-out", () => {
    expect(FADE_IN.duration).toBeLessThanOrEqual(0.2);
    expect(FADE_OUT.duration).toBeLessThan(FADE_IN.duration);
    expect(FADE_IN.ease).toBe("easeOut");
    expect(FADE_OUT.ease).toBe("easeOut");
  });

  it("uses the better-ui press scale of 0.96", () => {
    expect(PRESS_SCALE).toBe(0.96);
  });

  it("uses Emil's strong ease-out curve", () => {
    expect(EASE_OUT).toEqual([0.23, 1, 0.32, 1]);
  });
});
