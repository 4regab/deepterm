import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    /*
     * Hardcoded Tailwind palette colours bypass the design system. There are
     * ~380 of them across 42 page files today, so the rule is scoped to the
     * design system itself rather than run repo-wide as a warning: inside
     * src/components/ui it is an ERROR that blocks new debt, and page files
     * stay lint-clean until their migration phase adds them to `files`.
     * A warning everywhere would have been ignorable — 380 warnings is noise,
     * and the primitives are exactly where the leak has to be sealed.
     */
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // Any string literal, not just one sitting directly in className —
        // most of the debt lives in extracted `const VARIANTS = {...}` maps.
        {
          selector:
            "Literal[value=/\\b(bg|text|border)-(red|green|blue|gray|slate|zinc|amber|yellow)-\\d{2,3}\\b/]",
          message:
            "Use a semantic token (bg-surface, text-muted, bg-danger-subtle…) instead of a raw Tailwind palette colour.",
        },
        {
          selector:
            "TemplateElement[value.raw=/\\b(bg|text|border)-(red|green|blue|gray|slate|zinc|amber|yellow)-\\d{2,3}\\b/]",
          message:
            "Use a semantic token (bg-surface, text-muted, bg-danger-subtle…) instead of a raw Tailwind palette colour.",
        },
      ],
    },
  },
  {
    files: ["src/app/layout.tsx"],
    rules: {
      // Font is used in template literal className - ESLint doesn't detect it
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "sourceSerif4" }],
      // False positive - we're using next/font/google, not <link> tags
      "@next/next/no-page-custom-font": "off",
    },
  },
]);

export default eslintConfig;
