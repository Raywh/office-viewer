/**
 * Office Viewer Demo
 */
import { detectFormat } from '@office-viewer/core';

const state = {
  currentFile: null as File | null,
  currentFormat: 'unknown' as string,
  modules: new Map<string, any>(),
};

const elements = {
  uploadArea: document.getElementById('uploadArea')!,
  fileInput: document.getElementById('fileInput') as HTMLInputElement,
  uploadBtn: document.getElementById('uploadBtn')!,
  preview: document.getElementById('preview')!,
  previewContainer: document.getElementById('previewContainer')!,
  diagnostics: document.getElementById('diagnostics')!,
};

async function loadViewerModule(format: string): Promise<any> {
  if (!state.modules.has(format)) {
    let module;
    switch (format) {
      case 'docx':
        module = await import('@office-viewer/docx-viewer');
        break;
      case 'doc':
        module = await import('@office-viewer/msdoc-viewer');
        break;
      case 'pptx':
        module = await import('@office-viewer/pptx-viewer');
        break;
      case 'ppt':
        module = await import('@office-viewer/ppt-viewer');
        break;
      case 'xlsx':
      case 'xls':
        module = await import('@office-viewer/excel-viewer');
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    state.modules.set(format, module);
  }
  return state.modules.get(format);
}

async function renderByFormat(
  format: string,
  data: ArrayBuffer,
  container: HTMLElement
): Promise<{ summary: string }> {
  const startTime = Date.now();
  
  try {
    const module = await loadViewerModule(format);
    
    if (format === 'docx' && module.renderAsync) {
      await module.renderAsync(data, container);
    } else if (format === 'doc' && module.parseMsDoc) {
      const parsed = module.parseMsDoc(data);
      const rendered = module.renderMsDoc(parsed);
      module.mountMsDoc(container, rendered);
    } else if ((format === 'xlsx' || format === 'xls') && module.mountExcel) {
      const workbook = module.parseExcelWorkbook(data);
      module.mountExcel(container, workbook);
    } else if (format === 'pptx' && module.renderPresentationToElement) {
      const parsed = await module.parsePptx(data);
      module.renderPresentationToElement(parsed, container, { virtualize: true });
    }
    
    const duration = Date.now() - startTime;
    updateDiagnostics(`Rendered in ${duration}ms`);
    
    return { summary: `Rendered in ${duration}ms` };
  } catch (error) {
    updateDiagnostics(`Error: ${error}`);
    throw error;
  }
}

function updateDiagnostics(message: string): void {
  elements.diagnostics.innerHTML = `<p>${message}</p>`;
}

function initEventListeners(): void {
  elements.uploadBtn.addEventListener('click', () => {
    elements.fileInput.click();
  });

  elements.fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      await handleFile(file);
    }
  });

  elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
  });

  elements.uploadArea.addEventListener('dragleave', () => {
    elements.uploadArea.classList.remove('dragover');
  });

  elements.uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer?.files[0];
    if (file) {
      await handleFile(file);
    }
  });
}

async function handleFile(file: File): Promise<void> {
  state.currentFile = file;
  
  const arrayBuffer = await file.arrayBuffer();
  const format = detectFormat(arrayBuffer);
  
  if (format === 'unknown') {
    updateDiagnostics('无法识别的文件格式');
    return;
  }
  
  state.currentFormat = format;
  updateDiagnostics(`Detected format: ${format}`);
  
  await renderByFormat(format, arrayBuffer, elements.preview);
}

initEventListeners();

console.log('Office Viewer Demo initialized');
