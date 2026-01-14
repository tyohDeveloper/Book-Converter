import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.replit/**',
      'attached_assets/**',
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'max-lines-per-function': ['warn', {
        max: 20,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message: 'Barrel exports (export * from) are not allowed. Use direct imports.',
        },
        {
          selector: 'ExportNamedDeclaration[source]',
          message: 'Re-export barrels (export { x } from) are discouraged. Define exports in source files.',
        },
      ],
    },
  },
];
