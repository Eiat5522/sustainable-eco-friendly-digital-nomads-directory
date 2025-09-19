import studio from '@sanity/eslint-config-studio'
import tseslint from '@typescript-eslint/eslint-plugin'

const config = [
  ...studio,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    files: ['sanity.types.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
]

export default config
