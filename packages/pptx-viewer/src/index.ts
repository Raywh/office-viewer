import { ZipPackage } from '@office-viewer/core';

export interface PptxOptions {
  maxImages?: number;
  virtualize?: boolean;
}

export interface ParsedPptx {
  slides: Array<{
    id: string;
    text: string;
    images?: Array<{ id: string; data?: string }>;
  }>;
}

export function parsePptx(
  data: ArrayBuffer,
  options?: PptxOptions
): ParsedPptx {
  let slides: Array<{ id: string; text: string; images?: any[] }> = [];
  
  try {
    const zipPackage = new ZipPackage(data);
    
    const parts = zipPackage.listAllParts?.() || [];
    const slideParts = parts.filter((p: string) => /slide\d+\.xml/.test(p));
    
    if (slideParts.length > 0) {
      for (let i = 0; i < slideParts.length; i++) {
        slides.push({
          id: `slide-${i + 1}`,
          text: `第 ${i + 1} 页（pptx 文件解析中）`,
        });
      }
    }
    
    if (slides.length === 0) {
      const view = new Uint8Array(data);
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const scanText = textDecoder.decode(view.slice(0, Math.min(view.length, 65536)));
      
      let allText = '';
      const lines = scanText.split(/\r?\n/);
      for (const line of lines) {
        const cleanLine = line.replace(/\0/g, '').trim();
        if (cleanLine.length > 2) {
          allText += cleanLine + ' ';
        }
      }
      
      slides.push({
        id: 'slide-1',
        text: allText || '第 1 页',
      });
    }
  } catch (error) {
    console.error('Error parsing .pptx file:', error);
    slides.push({
      id: 'slide-1',
      text: '（不支持的 .pptx 文件）',
    });
  }
  
  return { slides };
}

export function renderPresentationToHtml(
  presentation: ParsedPptx
): string {
  return `
    <div class="pptx-viewer">
      <h2 style="margin-bottom: 24px;">📽️ .pptx 查看</h2>
      <div style="padding: 24px; border: 1px dashed #e2e8f0; border-radius: 8px; background: #f8fafc; margin-bottom: 24px;">
        <p style="color: #64748b;">
          .pptx 解析器正在开发中。以下是简单预览：
        </p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 24px;">
        ${presentation.slides.map((slide, index) => `
          <div style="padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
            <h3 style="margin-bottom: 16px; color: #64748b;">第 ${index + 1} 页</h3>
            <p style="color: #1e293b;">${slide.text}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderSlideToHtml(
  slide: any,
  presentation: ParsedPptx
): string {
  return `<div style="padding: 32px;">${slide.text}</div>`;
}

export function renderPresentationToElement(
  presentation: ParsedPptx,
  container: HTMLElement,
  options?: PptxOptions
): any {
  container.innerHTML = renderPresentationToHtml(presentation);
  return { container, presentation };
}

export function mountPptxViewer(
  container: HTMLElement,
  options?: PptxOptions
): any {
  return { container, options };
}
