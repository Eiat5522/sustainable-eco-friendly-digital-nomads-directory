import studio from '@sanity/eslint-config-studio';

export default [
  ...studio,
  {
    files: [
      'migrate-city-references.js',
      'migrate-legacy-fields.js',
      'migrate-orphan-favorites.js',
      'sanity.config.js',
    ],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    ignores: ['sanity.types.ts'],
  },
];
