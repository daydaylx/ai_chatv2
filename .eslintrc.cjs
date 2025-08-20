/** Minimal, aber sinnvoll für React + TS + Vite */
module.exports = {
  root: true,
  env: { browser: true, es2023: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true }
  },
  settings: {
    react: { version: "detect" },
    "import/resolver": {
      typescript: true
    }
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "import", "jsx-a11y"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jsx-a11y/recommended",
    "prettier"
  ],
  rules: {
    // Typische Nerv-Regeln entschärfen:
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "react/react-in-jsx-scope": "off",     // Vite/React 17+ JSX-Runtime
    "react/prop-types": "off",             // wir nutzen TypeScript-Typen
    "import/order": ["warn", {
      "groups": [["builtin","external","internal"],["parent","sibling","index"]],
      "newlines-between": "always"
    }],
    "no-console": ["warn", { "allow": ["warn","error"] }]
  },
  overrides: [
    {
      files: ["**/*.test.*", "**/__tests__/**"],
      env: { jest: true, node: true },
      rules: { "no-console": "off" }
    }
  ]
};
