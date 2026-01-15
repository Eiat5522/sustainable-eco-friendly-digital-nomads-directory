import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import pluginJest from 'eslint-plugin-jest';
import { fileURLToPath } from 'node:url';
import requireReactFcTypeParametersRule from './eslint/rules/require-react-fc-type-parameters.js';

// Normalize configs to arrays for safe spreading
const _nextCoreWebVitals = Array.isArray(nextCoreWebVitals)
  ? nextCoreWebVitals
  : [nextCoreWebVitals];
const _nextTypescript = Array.isArray(nextTypescript) ? nextTypescript : [nextTypescript];

const __dirname = fileURLToPath(new URL('.', import.meta.url));
import pluginJest from 'eslint-plugin-jest';
/** @type {import('eslint').Linter.FlatConfig[]} */
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
      '../sanity/**',
      '**/.env*',
      '**/.github/skills/**',
      '**/next-env.d.ts',
    ],
  },
  {
    // Help eslint-plugin-next resolve the project root correctly in monorepos
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },
  ..._nextCoreWebVitals,
  ..._nextTypescript,
  {
    // Jest config
    files: ['**/*.spec.js', '**/*.test.js', '**/*.test.*', '**/__tests__/**/*', '**/tests/**/*'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },
  {
    plugins: {
      'local-react-strictness': {
        rules: {
          'require-react-fc-type-parameters': requireReactFcTypeParametersRule,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^ignored',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 3 },
      ],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-var': 'warn',
      'prefer-const': 'warn',
      'local-react-strictness/require-react-fc-type-parameters': 'warn',
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
  {
    files: ['**/*.test.*', '**/__tests__/**/*', '**/tests/**/*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
      'react/display-name': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'jest/prefer-to-have-length': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-var': 'off',
    },
  },
  {
    files: ['**/__mocks__/**/*'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    // CommonJS files (.cjs) and root-level test/debug scripts should use require()
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
  {
    files: ['./sanity.types.ts'],
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
];

export default eslintConfig;
