import { ZipPackage } from '@office-viewer/core';

export interface WordDocument {
  sections: Array<{
    id: string;
    properties: any;
    paragraphs: Array<{
      id: string;
      properties: any;
      text: string;
    }>;
  }>;
  relationships: Map<string, any>;
}

export async function parseDocument(
  data: ArrayBuffer
): Promise<WordDocument> {
  const zipPackage = await ZipPackage.create(data);
  const documentPart = zipPackage.getPart('word/document.xml');

  if (!documentPart) {
    console.error('[DocxParser] No document.xml found');
    return {
      sections: [],
      relationships: new Map(),
    };
  }

  const docXml = documentPart.getXml();

  // Parse body
  const body = docXml.querySelector('body');
  const paragraphs: Array<{ id: string; properties: any; text: string }> = [];

  if (body) {
    const bodyChildren = Array.from(body.children);
    console.log('[DocxParser] Body children count:', bodyChildren.length);

    for (let i = 0; i < bodyChildren.length; i++) {
      const child = bodyChildren[i];
      
      // Check if it's a paragraph (p) in any namespace
      if (child.nodeName.toLowerCase().includes('p') || 
          child.tagName?.toLowerCase().includes('p')) {
        
        // Extract all text from t elements
        const textNodes = child.querySelectorAll('t');
        const textParts: string[] = [];
        
        textNodes.forEach(node => {
          const t = node.textContent?.trim();
          if (t) {
            textParts.push(t);
          }
        });

        // Join into a single paragraph
        if (textParts.length > 0 || child.textContent?.trim()) {
          const text = textParts.length > 0 
            ? textParts.join(' ') 
            : child.textContent?.trim() || '';
          
          if (text.length > 0) {
            paragraphs.push({
              id: `p-${i}`,
              properties: {},
              text,
            });
          }
        }
      }
    }
  }

  console.log('[DocxParser] Parsed paragraphs:', paragraphs);

  return {
    sections: [{
      id: 'section-0',
      properties: {},
      paragraphs,
    }],
    relationships: new Map(),
  };
}

export function renderDocumentToHtml(doc: WordDocument): string {
  if (!doc.sections.length) {
    return `
      <div class="doc-error" style="padding: 24px; text-align: center; color: #ef4444;">
        文档解析失败或为空
      </div>
    `;
  }

  const section = doc.sections[0];

  return `
    <div class="docx-viewer" style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 32px;
      background: white;
      min-height: 100%;
      line-height: 1.8;
    ">
      <div class="doc-content" style="max-width: 800px; margin: 0 auto;">
        ${section.paragraphs.map(p => `
          <p style="
            margin: 16px 0;
            font-size: 1rem;
            color: #1e293b;
          ">${p.text}</p>
        `).join('')}
      </div>
    </div>
  `;
}

export async function renderAsync(
  data: ArrayBuffer | Blob | File,
  container: HTMLElement,
  _styleContainer?: HTMLElement,
  _options?: any
): Promise<void> {
  console.log('[DocxViewer] renderAsync called');
  
  let buffer: ArrayBuffer;
  if (data instanceof Blob || data instanceof File) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = data;
  }

  const doc = await parseDocument(buffer);
  
  container.innerHTML = renderDocumentToHtml(doc);
}

// 兼容以前的直接导入方式
export { parseDocument as parse };
