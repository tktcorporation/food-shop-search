import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  test: {
    // ziku 同期の bun テスト（tools / scripts）はルート Vitest の対象外
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tools/**',
      'scripts/docs-lifecycle/**',
      '.claude/**',
    ],
  },
});
