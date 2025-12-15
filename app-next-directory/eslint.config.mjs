import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import requireReactFcTypeParametersRule from './eslint/rules/require-react-fc-type-parameters.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Use FlatCompat to convert eslint-config-next to flat config format
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.vercel/**',
      '**/__generated__/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'tsconfig.test.json',
      './sanity/**',
      '**/.env*',
      '**/next-env.d.ts',
    ],
  },

  // Next.js + TypeScript baseline (already includes @typescript-eslint rules).
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Help eslint-plugin-next resolve the project root correctly in monorepos
  {
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },

  // Enable type-aware linting (required for many of the strongest TS rules).
  // NOTE: this requires your ESLint setup to be able to load your tsconfig.
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        // If you're on typescript-eslint v7+, ESLint will auto-detect this correctly.
        // If you hit performance issues, consider setting `project` to a specific tsconfig instead.
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Core: block unsafeness
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Promises / async correctness
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // Narrowing / correctness
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Imports / consistency
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false, fixStyle: 'separate-type-imports' },
      ],

      // Make “unsafe escapes” explicit (avoid `!`, `as`, etc.)
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },

  // Your local rule(s) + general stricter defaults
  {
    plugins: {
      'local-react-strictness': {
        rules: {
          'require-react-fc-type-parameters': requireReactFcTypeParametersRule,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^ignored',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 10 },
      ],
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/no-require-imports': 'error',

      // React
      'react-hooks/rules-of-hooks': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-comment-textnodes': 'warn',

      // Next.js
      '@next/next/no-html-link-for-pages': 'warn',

      // JS hygiene
      'import/no-anonymous-default-export': 'warn',
      'no-var': 'error',
      'prefer-const': 'warn',

      // Your custom strictness
      'local-react-strictness/require-react-fc-type-parameters': 'warn',

      // Naming (keep your existing allow-list)
      camelcase: [
        'error',
        {
          properties: 'never',
          ignoreDestructuring: true,
          ignoreImports: true,
          allow: [
            '^_id$',
            '^_type$',
            '^_rev$',
            '^_createdAt$',
            '^_updatedAt$',
            '^_score$',
            '^unstable_',
            '^ignored_',
          ],
        },
      ],
    },
  },

  // Tests: keep strict types, but relax a few ergonomics.
  {
    files: ['**/*.test.*', '**/__tests__/**/*', '**/tests/**/*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 3 },
      ],
      // If you want to allow `any` only in tests, flip this to 'warn' or 'off'.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Declaration files: avoid noisy lint (these often need looser typing)
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-var': 'off',
    },
  },

  // Mocks: allow CommonJS and small shortcuts
  {
    files: ['**/__mocks__/**/*'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },

  // CommonJS files (.cjs) and root-level scripts should use require()
  {
    files: [
      '**/*.cjs',
      'test-*.js',
      'check-*.js',
      'debug-*.js',
      'quick-*.js',
      'scripts/**/*.js',
      'tailwind.config.js',
      'jest/**/*.js',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Generated file (keep your existing exception)
  {
    files: ['./sanity.types.ts'],
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
];

export default eslintConfig;
