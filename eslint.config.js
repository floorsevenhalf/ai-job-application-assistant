import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "playwright-report/**", "test-results/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["extension/**/*.{ts,tsx}", "examples/**/*.tsx"],
    languageOptions: { globals: { ...globals.browser, chrome: "readonly" } },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules
  },
  {
    files: ["extension/public/**/*.js"],
    languageOptions: { globals: { ...globals.browser, chrome: "readonly" } }
  },
  {
    files: ["extension/core/normalization/normalize-text.ts"],
    rules: { "no-irregular-whitespace": "off", "no-useless-escape": "off", "no-control-regex": "off" }
  },
  {
    files: ["tests/**/*.ts", "*.config.ts"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: { globals: globals.node }
  }
);