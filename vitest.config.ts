import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'server/**/__tests__/**/*.test.ts',
      'client/src/**/__tests__/**/*.test.ts',
      'shared/**/__tests__/**/*.test.ts',
    ],
    exclude: ['node_modules', '.cache'],
    alias: {
      'node:test': 'vitest',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
});
