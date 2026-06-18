import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['packages/*/tests/**/*.{test,spec}.{ts,tsx}',
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.{ts,tsx}',
    },
  },
  resolve: {
    alias: {
      '@office-viewer/core': '/packages/core/src/index.ts',
      '@office-viewer/msdoc-viewer': '/packages/msdoc-viewer/src/index.ts',
      '@office-viewer/docx-viewer': '/packages/docx-viewer/src/index.ts',
      '@office-viewer/ppt-viewer': '/packages/ppt-viewer/src/index.ts',
      '@office-viewer/pptx-viewer': '/packages/pptx-viewer/src/index.ts',
      '@office-viewer/excel-viewer': '/packages/excel-viewer/src/index.ts',
    },
  },
});
