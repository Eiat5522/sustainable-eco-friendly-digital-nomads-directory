import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { Linter } from 'eslint';

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/.vercel/**",
    ],
  },
    {
    // Help eslint-plugin-next resolve the project root correctly in monorepos
    settings: {
      next: {
        // You can also set this to an array of roots if needed
        rootDir: __dirname,
      },
    },
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
export default eslintConfig;
