import { ZipPackage } from '@office-viewer/core';
import { DocumentParser } from './parser/document-parser';

// 直接复制接口定义，避免导入问题
export interface ParseOptions {
  includeStyles?: boolean;
  includeComments?: boolean;
  includeHeadersFooters?: boolean;
  maxImages?: number;
}

export interface WordDocument {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  created?: Date;
  modified?: Date;
  sections: any[];
  relationships: Map<string, any>;
}

export async function parseAsync(
  data: ArrayBuffer | Blob | File,
  options?: ParseOptions
): Promise<WordDocument> {
  let buffer: ArrayBuffer;

  if (data instanceof Blob || data instanceof File) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = data;
  }

  const zipPackage = new ZipPackage(buffer);
  const parser = new DocumentParser(zipPackage, options);
  return await parser.parse();
}

export async function renderAsync(
  data: ArrayBuffer | Blob | File,
  container: HTMLElement,
  styleContainer?: HTMLElement,
  options?: ParseOptions
): Promise<void> {
  console.log('[DocxViewer] renderAsync called');
  const doc = await parseAsync(data, options);
  console.log('[DocxViewer] Parsed doc:', doc);
  await renderDocument(doc, container, styleContainer);
}

export async function renderDocument(
  doc: WordDocument,
  container: HTMLElement,
  styleContainer?: HTMLElement
): Promise<void> {
  container.innerHTML = '';

  const docContainer = document.createElement('div');
  docContainer.className = 'docx-viewer';

  for (const section of doc.sections) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'docx-section';

    for (const child of section.children) {
      if (child.type === 'paragraph') {
        sectionEl.appendChild(renderParagraph(child));
      } else if (child.type === 'table') {
        sectionEl.appendChild(renderTable(child));
      }
    }

    docContainer.appendChild(sectionEl);
  }

  container.appendChild(docContainer);
}

function renderParagraph(paragraph: any): HTMLElement {
  const p = document.createElement('p');
  p.className = 'docx-paragraph';

  for (const run of paragraph.children) {
    if (run.type === 'run') {
      p.appendChild(renderRun(run));
    }
  }

  return p;
}

function renderRun(run: any): HTMLElement {
  const span = document.createElement('span');
  span.className = 'docx-run';

  applyRunStyles(span, run.properties);

  for (const text of run.children) {
    if (text.type === 'text') {
      span.appendChild(document.createTextNode(text.content));
    }
  }

  return span;
}

function applyRunStyles(element: HTMLElement, props: any): void {
  if (props.bold) {
    element.style.fontWeight = 'bold';
  }
  if (props.italic) {
    element.style.fontStyle = 'italic';
  }
  if (props.strike) {
    element.style.textDecoration = 'line-through';
  }
  if (props.underline) {
    element.style.textDecoration = 'underline';
  }
  if (props.size) {
    element.style.fontSize = `${props.size / 2}pt`;
  }
  if (props.color) {
    element.style.color = `#${props.color}`;
  }
}

function renderTable(table: any): HTMLElement {
  const tableEl = document.createElement('table');
  tableEl.className = 'docx-table';

  for (const row of table.rows) {
    tableEl.appendChild(renderTableRow(row));
  }

  return tableEl;
}

function renderTableRow(row: any): HTMLElement {
  const tr = document.createElement('tr');
  tr.className = 'docx-table-row';

  for (const cell of row.cells) {
    tr.appendChild(renderTableCell(cell));
  }

  return tr;
}

function renderTableCell(cell: any): HTMLElement {
  const td = document.createElement('td');
  td.className = 'docx-table-cell';

  for (const block of cell.children) {
    if (block.type === 'paragraph') {
      td.appendChild(renderParagraph(block));
    }
  }

  return td;
}
