import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/**
 * Flat ESLint config (ESLint v9). Lints the hand-written source only — the
 * generated type surface (`src/generated/**`, `src/schemas.ts`) and build
 * output are ignored, since their style is dictated by the generator, not by
 * hand. Keep lint meaningful for the code humans actually edit.
 */
export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/generated/**",
      "src/schemas.ts",
    ],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
];
