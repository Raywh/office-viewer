import { ZipPackage } from '@office-viewer/core';

export interface PptxOptions {
  maxImages?: number;
  virtualize?: boolean;
}

export interface ParsedPptx {
  slides: Array<{
    id: string;
    title: string;
    content: string[];
  }>;
}

export async function parsePptx(
  data: ArrayBuffer,
  options?: PptxOptions
): Promise<ParsedPptx> {
  const slides: Array<{ id: string; title: string; content: string[] }> = [];
  
  try {
    const zipPackage = await ZipPackage.create(data);
    
    // First read the presentation to get slide count/order
    const presentationPart = zipPackage.getPart('ppt/presentation.xml');
    let slideCount = 0;
    if (presentationPart) {
      const xml = presentationPart.getXml();
      const sldIdLst = xml.querySelector('sldIdLst');
      if (sldIdLst) {
        slideCount = sldIdLst.querySelectorAll('sldId').length;
      }
    }
    
    // If we can't get from presentation, scan for slide files
    if (slideCount === 0) {
      // Let's find all slide files
      const parts = zipPackage.listAllParts ? zipPackage.listAllParts() : [];
      const slideParts = (parts as string[]).filter((p: string) => /ppt\/slides\/slide\d+\.xml/.test(p));
      slideCount = slideParts.length;
    }
    
    // Now read each slide
    for (let i = 1; i <= slideCount; i++) {
      const slidePart = zipPackage.getPart(`ppt/slides/slide${i}.xml`);
      if (slidePart) {
        const slideXml = slidePart.getXml();
        
        const title: string[] = [];
        const content: string[] = [];
        
        // Extract all text from <a:t> elements
        const textNodes = slideXml.querySelectorAll('t');
        textNodes.forEach((node) => {
          const text = node.textContent?.trim();
          if (text && text.length > 0) {
            if (title.length === 0) {
              title.push(text);
            } else {
              content.push(text);
            }
          }
        });
        
        slides.push({
          id: `slide-${i}`,
          title: title.length > 0 ? title.join(' ') : `第 ${i} 页`,
          content: content,
        });
      }
    }
    
    // Fallback if no slides parsed
    if (slides.length === 0) {
      slides.push({
        id: 'slide-1',
        title: '第 1 页',
        content: ['演示文稿内容'],
      });
    }
  } catch (error) {
    console.error('Error parsing .pptx file:', error);
    slides.push({
      id: 'slide-1',
      title: '解析失败',
      content: [`错误: ${error}`],
    });
  }
  
  return { slides };
}

export function renderPresentationToHtml(
  presentation: ParsedPptx
): string {
  return `
    <div class="pptx-viewer" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px;">
      <h2 style="margin-bottom: 24px; color: #1e293b;">📽️ PowerPoint 预览</h2>
      <div style="display: flex; flex-direction: column; gap: 24px;">
        ${presentation.slides.map((slide, index) => `
          <div style="padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="margin-bottom: 16px; color: #3b82f6; font-size: 1.5rem; font-weight: 700;">第 ${index + 1} 页: ${slide.title}</h3>
            ${slide.content.length > 0 ? `
              <ul style="list-style-type: disc; padding-left: 24px; color: #475569; line-height: 1.8;">
                ${slide.content.map((text) => `<li style="margin-bottom: 8px;">${text}</li>`).join('')}
              </ul>
            ` : `
              <p style="color: #94a3b8; font-style: italic;">（此页无文本内容）</p>
            `}
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
  return `<div style="padding: 32px;">${slide.title || 'Slide'}</div>`;
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
