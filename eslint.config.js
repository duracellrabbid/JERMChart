import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import regexpPlugin from 'eslint-plugin-regexp';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'release/**',
      'coverage/**',
      'node_modules/**',
      '**/*.d.ts',
      'electron/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  regexpPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Rule 4: Cognitive Complexity must remain strictly below 15
      'sonarjs/cognitive-complexity': ['error', 15],

      // Rule 5: ReDoS prevention and linear regex
      'regexp/no-super-linear-backtracking': 'error',
      'regexp/optimal-quantifier-concatenation': 'error',

      // Project-specific exceptions
      'sonarjs/pseudo-random': 'off', // Math.random is used for canvas node positioning / non-crypto fallbacks
      'sonarjs/no-nested-conditional': 'warn',

      // General code quality & TypeScript guardrails
      '@typescript-eslint/no-explicit-any': 'off', // Permitted for external xlsx/data payloads
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      // Relax cognitive complexity and test-specific patterns inside test suites
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/prefer-specific-assertions': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/assertions-in-tests': 'off',
      'sonarjs/public-static-readonly': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/unused-import': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  }
);
