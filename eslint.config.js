// Flat config
import js from "@eslint/js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsparser,
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        fetch: "readonly",
        performance: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setImmediate: "readonly",
        MessageChannel: "readonly",
        MutationObserver: "readonly",
        MSApp: "readonly",
        // Node globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      },
      parserOptions: { 
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
      "@typescript-eslint": tseslint
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { "allowConstantExport": true }],
      "no-prototype-builtins": "off",
      "no-cond-assign": "off",
      "no-empty": "off",
      "getter-return": "off",
      "no-misleading-character-class": "off",
      "no-useless-escape": "off"
    }
  },
  {
    files: ["dist/**/*"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-prototype-builtins": "off"
    }
  }
];
