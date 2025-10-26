import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  // Base configs
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  ...svelte.configs['flat/prettier'],
  prettier,

  // Global configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte']
      }
    },
    rules: {}
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

  // Ignore patterns
  {
    ignores: [
      '**/.*',
      '.*',
      '**/.DS_Store',
      '**/node_modules',
      '**/build',
      '**/dist',
      '**/.svelte-kit',
      '**/package',
      '**/.env',
      '**/.env.*',
      '!**/.env.example',
      '**/pnpm-lock.yaml',
      '**/bun.lock',
      '**/package-lock.json',
      '**/yarn.lock',
      '**/vite.config.*.timestamp-*',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/*.config.ts'
    ]
  }
];
