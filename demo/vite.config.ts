import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@office-viewer/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@office-viewer/msdoc-viewer': path.resolve(__dirname, '../packages/msdoc-viewer/src/index.ts'),
      '@office-viewer/docx-viewer': path.resolve(__dirname, '../packages/docx-viewer/src/index.ts'),
      '@office-viewer/ppt-viewer': path.resolve(__dirname, '../packages/ppt-viewer/src/index.ts'),
      '@office-viewer/pptx-viewer': path.resolve(__dirname, '../packages/pptx-viewer/src/index.ts'),
      '@office-viewer/excel-viewer': path.resolve(__dirname, '../packages/excel-viewer/src/index.ts'),
    },
  },
});
