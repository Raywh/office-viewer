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
  previewPlaceholder: document.getElementById('previewPlaceholder')!,
  previewTitle: document.getElementById('previewTitle')!,
  diagnostics: document.getElementById('diagnostics')!,
  fileInfo: document.getElementById('fileInfo')!,
  fileName: document.getElementById('fileName')!,
  fileFormat: document.getElementById('fileFormat')!,
  fileSize: document.getElementById('fileSize')!,
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
    } else if (format === 'doc') {
      const parsed = module.parseMsDoc ? module.parseMsDoc(data) : null;
      if (module.mountMsDoc && parsed) {
        module.mountMsDoc(container, { content: parsed.text });
      } else {
        container.innerHTML = '<div style="padding: 24px; color: #64748b;">老格式 .doc 文件暂不支持预览。</div>';
      }
    } else if ((format === 'xlsx' || format === 'xls') && module.mountExcel) {
      const workbook = await module.parseExcelWorkbook(data);
      module.mountExcel(container, workbook);
    } else if (format === 'pptx' && module.renderPresentationToElement) {
      const parsed = await module.parsePptx(data);
      module.renderPresentationToElement(parsed, container);
    } else if (format === 'ppt') {
      container.innerHTML = '<div style="padding: 24px; color: #64748b;">老格式 .ppt 文件暂不支持预览。</div>';
    }

    const duration = Date.now() - startTime;
    updateDiagnostics(`渲染完成，耗时 ${duration}ms`);
    return { summary: `Rendered in ${duration}ms` };
  } catch (error) {
    console.error('Render error:', error);
    updateDiagnostics(`错误: ${error}`);
    container.innerHTML = `<div style="padding: 24px; color: #ef4444;">预览失败: ${error}</div>`;
    throw error;
  }
}

function updateDiagnostics(message: string): void {
  elements.diagnostics.innerHTML = `<p>${message}</p>`;
}

function updateFileInfo(file: File, format: string): void {
  elements.fileInfo.style.display = 'block';
  elements.fileName.textContent = file.name;
  elements.fileFormat.textContent = format.toUpperCase();
  elements.fileSize.textContent = formatFileSize(file.size);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFormatIcon(format: string): string {
  switch (format) {
    case 'docx':
    case 'doc':
      return '📄';
    case 'xlsx':
    case 'xls':
      return '📊';
    case 'pptx':
    case 'ppt':
      return '📽️';
    default:
      return '📄';
  }
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
  let format = detectFormat(arrayBuffer, { filename: file.name });
  
  if (format === 'unknown') {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext) {
      const extMap: Record<string, string> = {
        'doc': 'doc',
        'docx': 'docx',
        'ppt': 'ppt',
        'pptx': 'pptx',
        'xls': 'xls',
        'xlsx': 'xlsx',
      };
      format = (extMap[ext] || 'unknown') as typeof format;
    }
  }
  
  if (format === 'unknown') {
    updateDiagnostics('无法识别的文件格式');
    return;
  }
  
  state.currentFormat = format;
  
  updateFileInfo(file, format);
  updateDiagnostics(`Detected format: ${format}`);
  elements.previewTitle.textContent = `${getFormatIcon(format)} 预览: ${file.name}`;
  elements.previewPlaceholder.style.display = 'none';
  elements.preview.style.display = 'block';
  
  await renderByFormat(format, arrayBuffer, elements.preview);
}

initEventListeners();

console.log('Office Viewer Demo initialized');
