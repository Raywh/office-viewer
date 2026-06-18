import { ZipPackage, ZipPart } from '@office-viewer/core';
import {
  WordDocument,
  Section,
  Block,
  Paragraph,
  Run,
  Text,
  Table,
  TableRow,
  TableCell,
  Inline,
  Break,
  Tab,
  Drawing,
  DrawingPosition,
  ImageData
} from '../model/document';

export interface ParseOptions {
  includeStyles?: boolean;
  includeComments?: boolean;
  includeHeadersFooters?: boolean;
  maxImages?: number;
}

export class DocumentParser {
  private zipPackage: ZipPackage;
  private documentXml: Document;
  private relationships: Map<string, string> = new Map();
  private options: ParseOptions;

  constructor(zipPackage: ZipPackage, options: ParseOptions = {}) {
    this.zipPackage = zipPackage;
    this.options = options;
  }

  async parse(): Promise<WordDocument> {
    console.log('[DocumentParser] Starting to parse...');
    const documentPart = this.zipPackage.getPart('word/document.xml');
    
    if (!documentPart) {
      console.warn('[DocumentParser] word/document.xml not found!');
      return {
        sections: [],
        relationships: new Map()
      };
    }

    console.log('[DocumentParser] Found document.xml, parsing...');
    this.documentXml = this.parseXml(documentPart.getText());
    console.log('[DocumentParser] Document XML parsed:', this.documentXml);
    this.loadRelationships();
    
    const sections = this.parseBody();

    return {
      sections: sections,
      relationships: this.getRelationshipsModel()
    };
  }

  private parseXml(xmlText: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xmlText, 'text/xml');
  }

  private loadRelationships(): void {
    const relsPart = this.zipPackage.getPart('word/_rels/document.xml.rels');
    if (!relsPart) return;

    const relsXml = this.parseXml(relsPart.getText());
    const relationships = relsXml.querySelectorAll('Relationship');

    relationships.forEach(rel => {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      if (id && target) {
        this.relationships.set(id, target);
      }
    });
  }

  private getRelationshipsModel(): Map<string, any> {
    const result = new Map<string, any>();
    for (const [id, target] of this.relationships) {
      result.set(id, { id, type: 'relationship', target });
    }
    return result;
  }

  private parseBody(): Section[] {
    console.log('[DocumentParser] parseBody() called');
    const sections: Section[] = [];
    const body = this.documentXml.querySelector('w\\:body, body');
    console.log('[DocumentParser] <w:body> found:', !!body);
    if (!body) return sections;

    const children = Array.from(body.children);
    console.log('[DocumentParser] Body children count:', children.length);
    console.log('[DocumentParser] Body children detailed:', children.map((c, i) => ({
      index: i,
      localName: c.localName,
      tagName: c.tagName,
      nodeName: c.nodeName,
      innerHTML: c.innerHTML?.slice(0, 200)
    })));
    let currentBlocks: Block[] = [];
    
    for (const child of children) {
      const name = child.localName.toLowerCase();
      console.log('[DocumentParser] Processing child:', name, child.tagName);
      if (name === 'p' || child.nodeName.toLowerCase().includes('p')) {
        const paragraph = this.parseParagraph(child);
        currentBlocks.push(paragraph);
      } else if (name === 'tbl' || child.nodeName.toLowerCase().includes('tbl')) {
        const table = this.parseTable(child);
        currentBlocks.push(table);
      } else if (name.includes('sectpr')) {
        sections.push({
          id: `section-${sections.length}`,
          properties: this.parseSectionProperties(child),
          children: [...currentBlocks]
        });
        currentBlocks = [];
      }
    }

    if (currentBlocks.length > 0 || sections.length === 0) {
      sections.push({
        id: `section-${sections.length}`,
        properties: {},
        children: [...currentBlocks]
      });
    }

    return sections;
  }

  private parseParagraph(element: Element): Paragraph {
    console.log('[DocumentParser] Parsing paragraph, tag:', element.localName, element.tagName);
    const propertiesEl = element.querySelector('w\\:pPr, pPr');
    const runs = this.parseParagraphChildren(element);

    return {
      type: 'paragraph',
      id: `p-${Math.random().toString(36).substr(2, 9)}`,
      properties: this.parseParagraphProperties(propertiesEl),
      children: runs
    };
  }

  private parseParagraphChildren(element: Element): Inline[] {
    const inlines: Inline[] = [];
    const children = Array.from(element.children);

    for (const child of children) {
      if (child.localName === 'r') {
        inlines.push(this.parseRun(child));
      } else if (child.localName === 'hyperlink') {
        inlines.push(...this.parseParagraphChildren(child));
      }
    }

    return inlines;
  }

  private parseRun(element: Element): Run {
    const propertiesEl = element.querySelector('w\\:rPr, rPr');
    const texts: Text[] = [];

    const tElements = element.querySelectorAll('w\\:t, t');
    tElements.forEach(tEl => {
      texts.push({
        type: 'text',
        content: tEl.textContent || ''
      });
    });

    const brElements = element.querySelectorAll('w\\:br, br');
    brElements.forEach(brEl => {
      texts.push({
        type: 'text',
        content: '\n'
      });
    });

    return {
      type: 'run',
      id: `r-${Math.random().toString(36).substr(2, 9)}`,
      properties: this.parseRunProperties(propertiesEl),
      children: texts
    };
  }

  private parseTable(element: Element): Table {
    const rows: TableRow[] = [];
    const propertiesEl = element.querySelector('w\\:tblPr, tblPr');
    const trElements = element.querySelectorAll('w\\:tr, tr');

    trElements.forEach((trEl, index) => {
      rows.push(this.parseTableRow(trEl, index));
    });

    return {
      type: 'table',
      id: `table-${Math.random().toString(36).substr(2, 9)}`,
      properties: {},
      rows: rows
    };
  }

  private parseTableRow(element: Element, index: number): TableRow {
    const cells: TableCell[] = [];
    const tcElements = element.querySelectorAll('w\\:tc, tc');

    tcElements.forEach((tcEl, tcIndex) => {
      cells.push(this.parseTableCell(tcEl, tcIndex));
    });

    return {
      type: 'tableRow',
      id: `tr-${index}`,
      cells: cells
    };
  }

  private parseTableCell(element: Element, index: number): TableCell {
    const blocks: Block[] = [];
    const pElements = element.querySelectorAll('w\\:p, p');

    pElements.forEach(pEl => {
      blocks.push(this.parseParagraph(pEl));
    });

    return {
      type: 'tableCell',
      id: `tc-${index}`,
      children: blocks
    };
  }

  private parseParagraphProperties(element: Element | null): any {
    return {};
  }

  private parseRunProperties(element: Element | null): any {
    const props: any = {};
    
    if (!element) return props;
    
    if (element.querySelector('w\\:b, b')) props.bold = true;
    if (element.querySelector('w\\:i, i')) props.italic = true;
    if (element.querySelector('w\\:strike, strike')) props.strike = true;
    if (element.querySelector('w\\:u, u')) props.underline = { style: 'single' };
    
    return props;
  }

  private parseSectionProperties(element: Element | null): any {
    return {};
  }
}
