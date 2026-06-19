import {
  ZipPackage,
  getFirstByLocalName,
  getAllByLocalName,
  getChildrenByLocalName,
} from '@office-viewer/core';

export interface ParsedPptx {
  slides: Array<{ id: string; title: string; content: string[] }>;
}

export async function parsePptx(data: ArrayBuffer): Promise<ParsedPptx> {
  const slides: Array<{ id: string; title: string; content: string[] }> = [];
  const zipPackage = await ZipPackage.create(data);

  const presentationPart = zipPackage.getPart('ppt/presentation.xml');
  let slideCount = 0;
  let slideIds: Array<{ id: string; target: string }> = [];

  if (presentationPart) {
    const xml = presentationPart.getXml();
    const sldIdLst = getFirstByLocalName(xml, 'sldIdLst');
    if (sldIdLst) {
      const idNodes = getChildrenByLocalName(sldIdLst, 'sldId');
      for (const idNode of idNodes) {
        const rId = idNode.getAttribute('r:id') ||
                    idNode.getAttribute('rId') ||
                    idNode.getAttribute('id');
        slideIds.push({ id: rId || '', target: '' });
      }
      slideCount = slideIds.length;
    }

    // Resolve slide targets via relationships
    if (slideCount > 0) {
      const relsPart = zipPackage.getPart('ppt/_rels/presentation.xml.rels');
      if (relsPart) {
        const relsXml = relsPart.getXml();
        const relNodes = getAllByLocalName(relsXml, 'Relationship');
        for (const relNode of relNodes) {
          const id = relNode.getAttribute('Id');
          const target = relNode.getAttribute('Target') || '';
          for (const s of slideIds) {
            if (s.id === id) s.target = target;
          }
        }
      }
    }
  }

  for (let i = 0; i < Math.max(slideCount, slideIds.length); i++) {
    let slidePart = null;
    if (slideIds[i] && slideIds[i].target) {
      const target = slideIds[i].target;
      const fullPath = target.startsWith('/')
        ? target.slice(1)
        : `ppt/${target}`;
      slidePart = zipPackage.getPart(fullPath);
    }
    if (!slidePart) {
      slidePart = zipPackage.getPart(`ppt/slides/slide${i + 1}.xml`);
    }

    if (slidePart) {
      const slideXml = slidePart.getXml();
      const content: string[] = [];
      const tNodes = getAllByLocalName(slideXml, 't');
      for (const tNode of tNodes) {
        const text = (tNode.textContent || '').trim();
        if (text && text.length > 0) content.push(text);
      }
      slides.push({
        id: `slide-${i + 1}`,
        title: content.length > 0 ? content[0] : `第 ${i + 1} 页`,
        content: content.slice(1),
      });
    }
  }

  if (slides.length === 0) {
    slides.push({ id: 'slide-1', title: '（无内容）', content: [] });
  }

  return { slides };
}

export function renderPresentationToElement(
  presentation: ParsedPptx,
  container: HTMLElement
): void {
  container.innerHTML = '';

  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = 'font-size: 18px; font-weight: 700; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;';
  titleDiv.textContent = `演示文稿预览（${presentation.slides.length} 页）`;
  container.appendChild(titleDiv);

  const slidesContainer = document.createElement('div');
  slidesContainer.style.cssText = 'padding: 16px 24px; display: flex; flex-direction: column; gap: 16px;';

  presentation.slides.forEach((slide, index) => {
    const slideDiv = document.createElement('div');
    slideDiv.style.cssText = 'padding: 20px 24px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';

    const heading = document.createElement('div');
    heading.style.cssText = 'font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px;';
    heading.textContent = `第 ${index + 1} 页 · ${slide.title}`;
    slideDiv.appendChild(heading);

    const contentDiv = document.createElement('ul');
    contentDiv.style.cssText = 'list-style: disc; padding-left: 24px; color: #334155; line-height: 1.7; font-size: 14px;';
    if (slide.content.length > 0) {
      slide.content.forEach(c => {
        const li = document.createElement('li');
        li.textContent = c;
        contentDiv.appendChild(li);
      });
      slideDiv.appendChild(contentDiv);
    } else {
      const empty = document.createElement('div');
      empty.style.cssText = 'color: #94a3b8; font-style: italic; font-size: 13px;';
      empty.textContent = '（此页无文本内容）';
      slideDiv.appendChild(empty);
    }

    slidesContainer.appendChild(slideDiv);
  });

  container.appendChild(slidesContainer);
}
