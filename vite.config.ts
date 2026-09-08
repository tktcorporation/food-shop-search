import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(rootDir, 'shared/src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'shared/**/*.test.ts', 'worker/**/*.test.ts'],
  },
});
