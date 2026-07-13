import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig(
  {
    ignores: ["dist", "node_modules", "**/*.{ts,tsx}"],
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.builtin,
      },
    },
  },
);
