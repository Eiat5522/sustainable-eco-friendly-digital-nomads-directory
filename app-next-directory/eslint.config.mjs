import { fileURLToPath } from "node:url";
import { Linter } from 'eslint';

// Robust import with CJS fallback for @eslint/eslintrc
let eslintrc;
try {
  eslintrc = await import('@eslint/eslintrc');
} catch (err) {
  eslintrc = await import('@eslint/eslintrc/dist/eslintrc.cjs');
}

const { FlatCompat } = eslintrc;

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
      "**/__generated__/**",
      "tsconfig.test.json",
      "../sanity/**",
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
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^ignored",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/ban-ts-comment": ["warn", { "ts-expect-error": "allow-with-description", "minimumDescriptionLength": 3 }],
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "import/no-anonymous-default-export": "warn",
      "no-var": "warn",
      "prefer-const": "warn",
      "react/jsx-key": "warn",
      "react/jsx-no-comment-textnodes": "warn"
    }
  },
  {
    files: ["**/*.test.*", "**/__tests__/**/*", "**/tests/**/*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/display-name": "off",
      "react-hooks/rules-of-hooks": "off"
    }
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  },
  {
    files: ["**/__mocks__/**/*"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "import/no-anonymous-default-export": "off"
    }
  },
  {
    // CommonJS files (.cjs) and root-level test/debug scripts should use require()
    files: [
      "**/*.cjs",
      "test-*.js",
      "check-*.js",
      "debug-*.js",
      "quick-*.js",
      "scripts/**/*.js",
      "tailwind.config.js"
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["./sanity.types.ts"],
    rules: {
      "@typescript-eslint/no-use-before-define": "off",
    },
  },
];
export default eslintConfig;
