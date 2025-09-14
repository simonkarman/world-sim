import { globalIgnores } from 'eslint/config';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  globalIgnores(['**/node_modules/', '**/dist/', '**/.next/']),
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  }, {
    // files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'max-len': ['error', {
        code: 150,
        ignoreComments: true,
        tabWidth: 2,
      }],

      'no-console': 'off',
      'no-param-reassign': 'off',
      'no-restricted-syntax': 'off',

      'no-use-before-define': ['error', {
        functions: false,
        classes: false,
        variables: true,
      }],

      'no-process-env': 'off',
      'no-await-in-loop': 'off',
      'prefer-destructuring': 'off',
      'import/prefer-default-export': 'off',
      'import/no-cycle': 'off',
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': ['error', 'always'],

      quotes: ['error', 'single', {
        avoidEscape: true,
      }],

      'no-trailing-spaces': 'error',
      semi: ['error', 'always'],
      'no-unreachable': 'error',
      'no-unexpected-multiline': 'error',
      // indent: ['error', 2],

      'space-infix-ops': ['error', {
        int32Hint: false,
      }],

      'object-curly-spacing': ['error', 'always'],
      'key-spacing': 'error',
      'space-in-parens': 'error',
      'no-multi-spaces': 'error',
      'comma-spacing': 'error',

      'no-multiple-empty-lines': ['error', {
        max: 1,
      }],

      '@typescript-eslint/lines-between-class-members': 'off',
      'class-methods-use-this': 'off',
      'import/extensions': 'off',
      'import/no-absolute-path': 'off',

      'no-plusplus': ['error', {
        allowForLoopAfterthoughts: true,
      }],

      '@typescript-eslint/indent': 'off',

      '@typescript-eslint/no-unused-vars': ['warn', {
        vars: 'all',
        args: 'none',
      }],

      'no-template-curly-in-string': 'off',
      'no-new': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];

export default eslintConfig;
