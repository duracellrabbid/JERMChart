/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      ignoreEmptyLines: true,
      reporter: ['text', 'json', 'html'],
      include: ['src/**', 'electron/**'],
      exclude: [
        'src/**/__tests__/**',
        'src/test/**',
        'src/types/**',
        '**/*.d.ts',
        '**/*.css',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
