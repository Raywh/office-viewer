import { CfbPackage } from '@office-viewer/core';

export interface MsdocOptions {
  maxImages?: number;
}

export interface ParsedMsdoc {
  text: string;
  hasImages: boolean;
  metadata?: Record<string, any>;
}

export function parseMsdoc(
  data: ArrayBuffer,
  options?: MsdocOptions
): ParsedMsdoc {
  let text = '';
  
  try {
    const view = new Uint8Array(data);
    const decoder = new TextDecoder('utf-16le', { fatal: false });
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    
    let hasText = false;
    let buffer = '';
    
    for (let i = 0; i < Math.min(view.length, 524288); i += 2) {
      if (i + 1 < view.length) {
        const char = String.fromCharCode(view[i]);
        if (/[\w\s\d\.,;:'"!?()\-]/.test(char)) {
          buffer += char;
          if (buffer.length > 100) {
            hasText = true;
          }
        }
      }
    }
    
    const scanText = textDecoder.decode(view.slice(0, Math.min(view.length, 1048576)));
    
    let finalText = '';
    const lines = scanText.split(/\r?\n/);
    for (const line of lines) {
      const cleanLine = line.replace(/\0/g, '').trim();
      if (cleanLine.length > 2) {
        finalText += cleanLine + '\n';
      }
    }
    
    if (finalText.length < 100 && buffer.length > 100) {
      finalText = buffer;
    }
    
    text = finalText || '（不支持的老格式 .doc 文件，请尝试转换为 .docx）';
  } catch (error) {
    console.error('Error parsing .doc file:', error);
    text = '（不支持的老格式 .doc 文件，请尝试转换为 .docx）';
  }
  
  return {
    text,
    hasImages: false,
    metadata: {},
  };
}

export function renderMsdoc(parsed: ParsedMsdoc): any {
  return {
    content: parsed.text,
  };
}

export function mountMsdoc(
  container: HTMLElement,
  rendered: any
): HTMLElement {
  container.innerHTML = '';
  
  const view = document.createElement('div');
  view.className = 'msdoc-viewer';
  view.style.padding = '24px';
  view.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  view.style.maxWidth = '8.5in';
  view.style.margin = '0 auto';
  view.style.background = 'white';
  view.style.minHeight = '100%';
  view.style.lineHeight = '1.6';
  
  const preview = document.createElement('div');
  preview.style.padding = '24px';
  preview.style.border = '1px dashed #e2e8f0';
  preview.style.borderRadius = '8px';
  preview.style.background = '#f8fafc';
  preview.style.color = '#64748b';
  preview.innerHTML = `
    <h3 style="margin-bottom: 16px; color: #1e293b;">📄 .doc 查看</h3>
    <p style="margin-bottom: 16px;">
      老格式 <strong>.doc</strong> 文件暂不完全支持解析。
      建议您：
    </p>
    <ul style="margin-bottom: 16px; margin-left: 24px;">
      <li>将文件转换为 .docx 格式</li>
      <li>或使用其他库（如 mammoth）处理</li>
    </ul>
    <div style="margin-top: 24px; padding: 16px; background: white; border-radius: 8px;">
      <h4 style="margin-bottom: 8px;">文本预览：</h4>
      <pre style="white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow: auto;">
${rendered.content || '(没有可识别的文本)'}
      </pre>
    </div>
  `;
  
  view.appendChild(preview);
  container.appendChild(view);
  
  return view;
}
