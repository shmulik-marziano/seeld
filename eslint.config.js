import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    /*
     * Fast-refresh's "only export components" rule is a dev-only HMR hint with no
     * runtime impact. Disable it where mixed exports are either vendored or idiomatic:
     *  - components/ui/**          → shadcn primitives that ship variants/hooks alongside the component
     *  - contexts/** & useAuth     → the standard "provider + matching hook" colocation pattern
     *  - components/slides/**      → static theme/template data modules paired with their renderers
     *  - Doodle/Logo               → static design-data constants colocated with their component
     */
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/contexts/**/*.{ts,tsx}",
      "src/hooks/useAuth.tsx",
      "src/components/slides/**/*.{ts,tsx}",
      "src/components/DoodleDecoration.tsx",
      "src/components/SeeIDLogo.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
