import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.d.ts", "node_modules/**", ".next/**", "fix-*.js", "fix-*.ts"],
    rules: {
      // Healthcare-specific strict rules (gradually re-enabling)
      "@typescript-eslint/no-explicit-any": "warn", // Re-enable as warning
      "@typescript-eslint/no-unused-vars": "warn", // Re-enable as warning
      "@typescript-eslint/no-require-imports": "error",
      "react-hooks/exhaustive-deps": "warn", // Re-enable as warning
      "react-hooks/rules-of-hooks": "error", // Keep this as error
      "react/jsx-key": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }], // Re-enable with exceptions
      // Security rules for healthcare (keep these)
      "no-eval": "error",
      "no-implied-eval": "error", 
      "no-new-func": "error",
      // Basic rules
      "prefer-const": "warn", // Re-enable as warning
      "no-var": "error",
      // Accessibility rules (gradually re-enabling)
      "jsx-a11y/alt-text": "warn", // Re-enable as warning
      "jsx-a11y/aria-role": "warn", // Re-enable as warning
      "jsx-a11y/click-events-have-key-events": "warn", // Re-enable as warning
      "jsx-a11y/no-static-element-interactions": "warn", // Re-enable as warning
      // React rules
      "react/no-unescaped-entities": "warn", // Re-enable as warning
      "react/jsx-no-undef": "error", // Keep this to catch undefined components
      // Next.js rules
      "@next/next/no-img-element": "off", // Keep disabled for now
      "@next/next/no-html-link-for-pages": "off", // Keep disabled for now
    },
  },
];

export default eslintConfig;
