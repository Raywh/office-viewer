import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
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
