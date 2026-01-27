import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import effectPlugin from '@effect/eslint-plugin';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@effect': effectPlugin,
    },
    rules: {
      // =============================================
      // Effect 公式 ESLint ルール
      // =============================================
      '@effect/dprint': 'off', // oxfmtを使用するためオフ

      // =============================================
      // Effect パターンの強制ルール
      // =============================================

      // new Promise() の直接使用を禁止 → Effect.async / Effect.tryPromise を使用
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Promise']",
          message:
            'new Promise() は禁止です。Effect.async() または Effect.tryPromise() を使用してください。',
        },
        {
          selector:
            "CallExpression[callee.object.name='Promise'][callee.property.name='all']",
          message:
            'Promise.all() は禁止です。Effect.all() を使用してください。',
        },
        {
          selector:
            "CallExpression[callee.object.name='Promise'][callee.property.name='race']",
          message:
            'Promise.race() は禁止です。Effect.race() を使用してください。',
        },
        {
          selector:
            "CallExpression[callee.object.name='Promise'][callee.property.name='allSettled']",
          message:
            "Promise.allSettled() は禁止です。Effect.all() with { mode: 'either' } を使用してください。",
        },
        {
          selector: 'ThrowStatement',
          message:
            'throw は禁止です。Effect.fail() または Data.TaggedError を使用してください。ただし main.tsx のエントリーポイントは例外です。',
        },
      ],

      // =============================================
      // TypeScript ルール (Effect 補完)
      // =============================================
      '@typescript-eslint/no-floating-promises': 'off', // oxlint で管理
      '@typescript-eslint/no-misused-promises': 'off', // oxlint で管理
    },
  },
  // main.tsx は throw を許可（エントリーポイント）
  {
    files: ['src/main.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // cacheManager.ts は既存のReact hookパターンを許可
  {
    files: ['src/utils/cacheManager.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];
