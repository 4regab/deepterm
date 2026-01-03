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
