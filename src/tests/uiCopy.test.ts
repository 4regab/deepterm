import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("interface copy and quality floor", () => {
  it("keeps 404 copy calm and recoverable", () => {
    const page = read("app/not-found.tsx");
    expect(page).not.toContain("Oops");
    expect(page).toContain("This page isn&apos;t here");
    expect(page).toContain("Go to home");
  });

  it("uses verb-first account actions", () => {
    const page = read("app/(dashboard)/account/page.tsx");
    expect(page).toContain("Save changes");
    expect(page).toContain("Delete this account?");
    expect(page).toContain("Delete account");
    expect(page).not.toContain("Save Changes");
  });

  it("ships a skip link and focus ring in global chrome", () => {
    const layout = read("app/layout.tsx");
    const css = read("styles/globals.css");
    expect(layout).toContain("SkipLink");
    expect(css).toContain(".skip-link");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("derives neutrals from a single ink token", () => {
    const css = read("styles/globals.css");
    expect(css).toContain("--ink: #171d2b");
    expect(css).toContain("color-mix(in srgb, var(--ink) 12%, transparent)");
    expect(css).toContain("--primary: #171d2b");
    expect(css).toContain("--background: #f0f0ea");
  });

  it("keeps Source Serif on the landing hero", () => {
    const home = read("app/HomeClient.tsx");
    expect(home).toContain("font-serif");
    expect(home).toContain("Study smarter");
    expect(home).toContain("bg-[#f0f0ea]");
    expect(home).toContain("bg-[#171d2b]");
  });
});
