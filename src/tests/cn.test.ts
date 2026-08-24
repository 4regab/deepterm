import { describe, expect, it } from "bun:test";
import { cn } from "../lib/cn";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("plate", "p-4", "text-foreground")).toBe("plate p-4 text-foreground");
  });

  it("drops false, null, and undefined", () => {
    expect(cn("btn", false, null, undefined, "active")).toBe("btn active");
  });

  it("keeps empty-string out of the result", () => {
    expect(cn("a", "", "b")).toBe("a b");
  });
});
