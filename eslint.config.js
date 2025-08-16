import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

/** Flat-Config (ESLint 8) – TS + React, Browser + Node/Worker-Overrides, Shell ignorieren */
export default [
  { ignores: ["dist/**", "node_modules/**", "**/*.{sh,bash,zsh}"] },

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        Request: "readonly",
        Headers: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooks
    },
    settings: { react: { version: "detect" } },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-no-target-blank": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-empty": ["error", { "allowEmptyCatch": false }]
    }
  },

  // Node-/Skripte (JS/TS in scripts/, tools/, *.cjs/*.mjs)
  {
    files: ["scripts/**/*.{js,ts,cjs,mjs}", "tools/**/*.{js,ts,cjs,mjs}", "**/*.{cjs,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly"
      }
    },
    rules: { "no-undef": "off" }
  },

  // Service Worker
  {
    files: ["src/sw.js"],
    languageOptions: { globals: { self: "readonly", caches: "readonly" } },
    rules: { "no-undef": "off" }
  }
];
