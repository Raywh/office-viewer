import { CfbPackage } from '@office-viewer/core';

export interface PptOptions {
  maxImages?: number;
}

export interface ParsedPpt {
  slides: Array<{
    text: string;
  }>;
  metadata?: Record<string, any>;
}

export function parsePpt(
  data: ArrayBuffer,
  options?: PptOptions
): ParsedPpt {
  let slidesText: string[] = [];
  
  try {
    const view = new Uint8Array(data);
    const textDecoder = new TextDecoder('utf-16le', { fatal: false });
    const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
    
    let allText = '';
    const scanView = view.slice(0, Math.min(view.length, 1048576));
    
    for (let i = 0; i < scanView.length - 1; i++) {
      const char = String.fromCharCode(scanView[i]);
      if (/[\w\s\d\.,;:'"!?()]/.test(char)) {
        allText += char;
      }
    }
    
    const cleanText = allText.replace(/\0/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (cleanText.length > 0) {
      slidesText.push(cleanText);
    }
  } catch (error) {
    console.error('Error parsing .ppt file:', error);
  }
  
  if (slidesText.length === 0) {
    slidesText.push('（不支持的老格式 .ppt 文件，请尝试转换为 .pptx）');
  }
  
  return {
    slides: slidesText.map(text => ({ text })),
  };
}

export function renderPptToHtml(parsed: ParsedPpt): string {
  const slidesHtml = parsed.slides.map((slide, index) => `
    <div class="ppt-slide" style="padding: 32px; border-bottom: 1px solid #e2e8f0;">
      <h3 style="margin-bottom: 16px;">第 ${index + 1} 页</h3>
      <p>${slide.text}</p>
    </div>
  `).join('');
  
  return `
    <div class="ppt-viewer">
      <h2 style="margin-bottom: 24px;">📽️ .ppt 查看</h2>
      <div style="padding: 24px; border: 1px dashed #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <p style="color: #64748b; margin-bottom: 16px;">
          老格式 <strong>.ppt</strong> 文件暂不完全支持解析。建议您：
        </p>
        <ul style="color: #64748b; margin-left: 24px;">
          <li>将文件转换为 .pptx 格式</li>
          <li>或使用其他库处理</li>
        </ul>
      </div>
      <div style="margin-top: 32px;">
        ${slidesHtml}
      </div>
    </div>
  `;
}

export function mountPptViewer(
  container: HTMLElement,
  options?: PptOptions
): any {
  return {
    container,
  };
}
