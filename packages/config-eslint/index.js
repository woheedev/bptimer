import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('../../.gitignore', import.meta.url));

export default [
  // Include gitignore patterns
  includeIgnoreFile(gitignorePath),

  // Base configs
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],

  // Global configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },

  // Svelte-specific configuration
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },

  // Svelte TypeScript files with runes (.svelte.ts)
  {
    files: ['**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },

  // Additional ignore patterns
  {
    ignores: [
      '**/build/**',
      '**/dist/**',
      '**/.svelte-kit/**',
      '**/package/**',
      '**/vite.config.*.timestamp-*'
    ]
  }
];
