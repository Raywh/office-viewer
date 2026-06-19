import {
  ZipPackage,
  getFirstByLocalName,
  getAllByLocalName,
  getChildrenByLocalName,
  getLocalName,
  getTextContent,
} from '@office-viewer/core';

export interface ParseOptions {
  includeStyles?: boolean;
  includeComments?: boolean;
  includeHeadersFooters?: boolean;
  maxImages?: number;
}

// ─── Model interfaces ──────────────────────────────────────────────────────────

export interface WordDocument {
  sections: Section[];
  relationships: Map<string, { id: string; type?: string; target: string }>;
}

export interface Section {
  id: string;
  properties: any;
  header?: HeaderFooter;
  footer?: HeaderFooter;
  children: Block[];
}

export type Block = Paragraph | Table;

export interface Paragraph {
  type: 'paragraph';
  id: string;
  properties: ParagraphProperties;
  children: Inline[];
}

export interface ParagraphProperties {
  styleId?: string;
  alignment?: 'left' | 'center' | 'right' | 'both' | 'distribute';
  spacing?: Spacing;
  indentation?: Indentation;
  shading?: Shading;
  numbering?: NumberingInfo;
}

export interface Spacing { before?: number; after?: number; line?: number; lineRule?: 'auto' | 'exact' | 'atLeast'; }
export interface Indentation { left?: number; right?: number; hanging?: number; firstLine?: number; }
export interface Shading { fill?: string; color?: string; pattern?: string; }
export interface NumberingInfo { id: string; level: number; numFmt?: string; left?: number; indent?: number; }

export type Inline = Run | Drawing | TabChar | Break | Hyperlink;

export interface Run {
  type: 'run';
  id: string;
  properties: RunProperties;
  children: Text[];
}

export interface RunProperties {
  styleId?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  size?: number;
  color?: string;
  highlight?: string;
  font?: string;
}

export interface Text { type: 'text'; content: string; }
export interface TabChar { type: 'tab'; }
export interface Break { type: 'break'; breakType: 'line' | 'page' | 'column'; }
export interface Hyperlink { type: 'hyperlink'; id: string; target: string; children: Inline[]; }

export interface Drawing {
  type: 'drawing';
  id: string;
  imageData?: ImageData;
  position: DrawingPosition;
}

export interface ImageData {
  id: string;
  dataUrl?: string;   // base64 data URL ready for <img src>
  contentType?: string;
  widthPx?: number;
  heightPx?: number;
}

export interface DrawingPosition {
  type: 'inline' | 'anchor';
  width: number;
  height: number;
  x?: number;
  y?: number;
}

export interface Table {
  type: 'table';
  id: string;
  properties: TableProperties;
  rows: TableRow[];
}

export interface TableProperties {
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  margins?: TableMargins;
  borders?: TableBorders;
  shading?: Shading;
}

export interface TableMargins { top?: number; bottom?: number; left?: number; right?: number; }
export interface TableBorder { color?: string; size?: number; style: string; }
export interface TableBorders {
  top?: TableBorder;
  bottom?: TableBorder;
  left?: TableBorder;
  right?: TableBorder;
  insideHorizontal?: TableBorder;
  insideVertical?: TableBorder;
}

export interface TableRow {
  type: 'tableRow';
  id: string;
  properties?: TableRowProperties;
  cells: TableCell[];
}

export interface TableRowProperties { height?: number; cantSplit?: boolean; tableHeader?: boolean; }

export interface TableCell {
  type: 'tableCell';
  id: string;
  properties?: TableCellProperties;
  children: Block[];
}

export interface TableCellProperties {
  width?: number;
  colspan?: number;
  rowspan?: number;
  shading?: Shading;
  borders?: TableCellBorders;
  verticalAlign?: 'top' | 'center' | 'bottom';
}

export interface TableCellBorders {
  top?: TableBorder;
  bottom?: TableBorder;
  left?: TableBorder;
  right?: TableBorder;
}

export interface HeaderFooter {
  id: string;
  type: 'default' | 'first' | 'even';
  children: Block[];
}

// ─── DocumentParser ────────────────────────────────────────────────────────────

export class DocumentParser {
  private zipPackage!: ZipPackage;
  private _options: ParseOptions;
  private docRels: Map<string, { id: string; type?: string; target: string }> = new Map();
  private numbering: Map<string, NumberingInfo> = new Map();

  constructor(zipPackage: ZipPackage, options: ParseOptions = {}) {
    this.zipPackage = zipPackage;
    this._options = options;
  }

  static async create(data: ArrayBuffer, options: ParseOptions = {}): Promise<DocumentParser> {
    const zipPackage = await ZipPackage.create(data);
    return new DocumentParser(zipPackage, options);
  }

  async parse(): Promise<WordDocument> {
    const documentPart = this.zipPackage.getPart('word/document.xml');
    if (!documentPart) return { sections: [], relationships: new Map() };

    const docXml = documentPart.getXml();

    // Load relationships so we can resolve image targets
    this.docRels = this.loadRelationships();

    // Load numbering definitions
    await this.loadNumbering();

    const body = getFirstByLocalName(docXml, 'body');
    const sections: Section[] = [];
    let currentBlocks: Block[] = [];
    let paragraphCounter = 0;

    if (body) {
      for (const child of Array.from(body.children)) {
        const local = getLocalName(child);
        if (local === 'p') {
          currentBlocks.push(this.parseParagraph(child, paragraphCounter++));
        } else if (local === 'tbl') {
          currentBlocks.push(this.parseTable(child));
        } else if (local === 'sectPr') {
          sections.push({
            id: `section-${sections.length}`,
            properties: this.parseSectionProperties(child),
            children: [...currentBlocks],
          });
          currentBlocks = [];
        }
      }
    }

    sections.push({
      id: `section-${sections.length}`,
      properties: {},
      children: currentBlocks,
    });

    return { sections, relationships: this.docRels };
  }

  private loadRelationships(): Map<string, { id: string; type?: string; target: string }> {
    const result = new Map();
    const relsPart = this.zipPackage.getPart('word/_rels/document.xml.rels');
    if (!relsPart) return result;
    const xml = relsPart.getXml();
    for (const rel of getAllByLocalName(xml, 'Relationship')) {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      const type = rel.getAttribute('Type');
      if (id && target) result.set(id, { id, type, target });
    }
    return result;
  }

  private async loadNumbering(): Promise<void> {
    const numberingPart = this.zipPackage.getPart('word/numbering.xml');
    if (!numberingPart) return;

    const xml = numberingPart.getXml();

    // Parse abstract numbering definitions (abstractNum)
    const abstractNums = new Map<string, { lvl: Array<{ ilvl: number; numFmt?: string; left?: number; indent?: number; pStyle?: string }> }>();
    for (const abstractNum of getAllByLocalName(xml, 'abstractNum')) {
      const absNumId = abstractNum.getAttribute('w:absNumId') || abstractNum.getAttribute('absNumId') || '';
      const levels: Array<{ ilvl: number; numFmt?: string; left?: number; indent?: number; pStyle?: string }> = [];
      for (const lvl of getChildrenByLocalName(abstractNum, 'lvl')) {
        const ilvl = parseInt(lvl.getAttribute('w:ilvl') || lvl.getAttribute('ilvl') || '0', 10);
        const numFmtEl = getFirstByLocalName(lvl, 'numFmt');
        const numFmt = numFmtEl
          ? (numFmtEl.getAttribute('w:val') || numFmtEl.getAttribute('val') || 'decimal')
          : 'decimal';
        const lvlJcEl = getFirstByLocalName(lvl, 'lvlJc');
        const left = lvlJcEl ? parseInt(lvlJcEl.getAttribute('w:left') || lvlJcEl.getAttribute('left') || '720', 10) : 720;
        const pPrIndEl = getFirstByLocalName(lvl, 'pPr');
        const pStyleEl = pPrIndEl ? getFirstByLocalName(pPrIndEl, 'pStyle') : null;
        const pStyle = pStyleEl
          ? (pStyleEl.getAttribute('w:val') || pStyleEl.getAttribute('val') || '')
          : '';
        levels.push({ ilvl, numFmt, left, indent: left, pStyle });
      }
      abstractNums.set(absNumId, { lvl: levels });
    }

    // Parse num → abstractNum mappings
    for (const num of getAllByLocalName(xml, 'num')) {
      const numId = num.getAttribute('w:numId') || num.getAttribute('numId') || '';
      const absNumIdEl = getFirstByLocalName(num, 'absNumId');
      const absNumId = absNumIdEl
        ? (absNumIdEl.getAttribute('w:val') || absNumIdEl.getAttribute('val') || '')
        : '';
      const absData = abstractNums.get(absNumId) || { lvl: [] };
      this.numbering.set(numId, {
        id: numId,
        level: 0,
        numFmt: absData.lvl[0]?.numFmt,
        left: absData.lvl[0]?.left,
        indent: absData.lvl[0]?.indent,
      });
    }
  }

  private parseParagraph(element: Element, idx: number): Paragraph {
    const pPr = getFirstByLocalName(element, 'pPr');
    return {
      type: 'paragraph',
      id: `p-${idx}`,
      properties: this.parseParagraphProperties(pPr),
      children: this.parseParagraphChildren(element),
    };
  }

  private parseParagraphProperties(pPr: Element | null): ParagraphProperties {
    if (!pPr) return {};
    const props: ParagraphProperties = {};

    // Style
    const pStyleEl = getFirstByLocalName(pPr, 'pStyle');
    if (pStyleEl) {
      props.styleId = pStyleEl.getAttribute('w:val') || pStyleEl.getAttribute('val') || '';
    }

    // Alignment
    const jcEl = getFirstByLocalName(pPr, 'jc');
    if (jcEl) {
      const v = jcEl.getAttribute('w:val') || jcEl.getAttribute('val') || '';
      if (v) props.alignment = v as ParagraphProperties['alignment'];
    }

    // Spacing
    const spacingEl = getFirstByLocalName(pPr, 'spacing');
    if (spacingEl) {
      props.spacing = {
        before: parseIntAttr(spacingEl, 'w:before') || parseIntAttr(spacingEl, 'before'),
        after: parseIntAttr(spacingEl, 'w:after') || parseIntAttr(spacingEl, 'after'),
        line: parseIntAttr(spacingEl, 'w:line') || parseIntAttr(spacingEl, 'line'),
        lineRule: getAttr(spacingEl, 'w:lineRule') || getAttr(spacingEl, 'lineRule') as any,
      };
    }

    // Indentation
    const indEl = getFirstByLocalName(pPr, 'ind');
    if (indEl) {
      props.indentation = {
        left: parseIntAttr(indEl, 'w:left') || parseIntAttr(indEl, 'left'),
        right: parseIntAttr(indEl, 'w:right') || parseIntAttr(indEl, 'right'),
        hanging: parseIntAttr(indEl, 'w:hanging') || parseIntAttr(indEl, 'hanging'),
        firstLine: parseIntAttr(indEl, 'w:firstLine') || parseIntAttr(indEl, 'firstLine'),
      };
    }

    // Shading
    const shdEl = getFirstByLocalName(pPr, 'shd');
    if (shdEl) {
      props.shading = {
        fill: getAttr(shdEl, 'w:fill') || getAttr(shdEl, 'fill'),
        color: getAttr(shdEl, 'w:color') || getAttr(shdEl, 'color'),
        pattern: getAttr(shdEl, 'w:val') || getAttr(shdEl, 'val'),
      };
    }

    // Numbering (list item)
    const numPrEl = getFirstByLocalName(pPr, 'numPr');
    if (numPrEl) {
      const ilvlEl = getFirstByLocalName(numPrEl, 'ilvl');
      const numIdEl = getFirstByLocalName(numPrEl, 'numId');
      const numId = numIdEl
        ? (numIdEl.getAttribute('w:val') || numIdEl.getAttribute('val') || '')
        : '';
      const ilvl = parseInt(
        ilvlEl
          ? (ilvlEl.getAttribute('w:val') || ilvlEl.getAttribute('val') || '0')
          : '0',
        10
      );
      const numInfo = this.numbering.get(numId);
      props.numbering = {
        id: numId,
        level: ilvl,
        numFmt: numInfo?.numFmt,
        left: numInfo?.left,
        indent: numInfo?.indent,
      };
    }

    return props;
  }

  private parseParagraphChildren(element: Element): Inline[] {
    const inlines: Inline[] = [];
    for (const child of Array.from(element.children)) {
      const local = getLocalName(child);
      if (local === 'r') {
        inlines.push(this.parseRun(child));
      } else if (local === 'hyperlink') {
        const rId = child.getAttribute('r:id') || child.getAttribute('id') || '';
        const rel = this.docRels.get(rId);
        inlines.push({
          type: 'hyperlink',
          id: rId,
          target: rel?.target || '',
          children: this.parseParagraphChildren(child),
        } as Hyperlink);
      } else if (local === 'br') {
        inlines.push({ type: 'break', breakType: 'line' } as Break);
      } else if (local === 'tab') {
        inlines.push({ type: 'tab' } as TabChar);
      } else if (local === 'drawing') {
        const drawing = this.parseDrawing(child);
        if (drawing) inlines.push(drawing);
      } else if (local === 'pict') {
        // VML picture (older Word format)
        const drawing = this.parseVmlPicture(child);
        if (drawing) inlines.push(drawing);
      }
    }
    return inlines;
  }

  private parseRun(element: Element): Run {
    const rPr = getFirstByLocalName(element, 'rPr');
    return {
      type: 'run',
      id: `r-${Math.random().toString(36).slice(2, 9)}`,
      properties: this.parseRunProperties(rPr),
      children: [{ type: 'text', content: getTextContent(element) }],
    };
  }

  private parseRunProperties(rPr: Element | null): RunProperties {
    const props: RunProperties = {};
    if (!rPr) return props;
    for (const child of Array.from(rPr.children)) {
      const local = getLocalName(child);
      switch (local) {
        case 'b':       props.bold = true; break;
        case 'i':       props.italic = true; break;
        case 'u':       props.underline = true; break;
        case 'strike':  props.strike = true; break;
        case 'sz':      props.size = parseIntAttr(child, 'w:val') / 2; break;
        case 'color':   props.color = getAttr(child, 'w:val'); break;
        case 'rFonts':
          props.font = getAttr(child, 'w:ascii') ||
                       getAttr(child, 'ascii') ||
                       getAttr(child, 'w:hAnsi') ||
                       getAttr(child, 'hAnsi');
          break;
        case 'vertAlign':
          if (getAttr(child, 'w:val') === 'superscript') props.superscript = true;
          else if (getAttr(child, 'w:val') === 'subscript') props.subscript = true;
          break;
        case 'highlight':
          props.highlight = getAttr(child, 'w:val') || getAttr(child, 'val'); break;
        case 'rStyle':
          props.styleId = getAttr(child, 'w:val') || getAttr(child, 'val'); break;
      }
    }
    return props;
  }

  // ─── Drawing / Image ─────────────────────────────────────────────────────────

  private parseDrawing(element: Element): Drawing | null {
    try {
      // OOXML inline drawing: <a:blip xmlns:a="..." r:embed="rId...">
      const blip = getFirstByLocalName(element, 'blip');
      const embedId = blip
        ? (blip.getAttribute('r:embed') || blip.getAttribute('r:id') || blip.getAttribute('id') || '')
        : '';

      // Dimensions: <wp:extent cx="..." cy="..."> or inline attributes
      let width = 200;
      let height = 150;
      const extentEl = getFirstByLocalName(element, 'extent');
      if (extentEl) {
        const cx = parseIntAttr(extentEl, 'cx') || 0;
        const cy = parseIntAttr(extentEl, 'cy') || 0;
        if (cx > 0) width = Math.round(cx / 914400);  // EMUs → px (96dpi)
        if (cy > 0) height = Math.round(cy / 914400);
      }

      // Also try inline extent attributes on drawing element itself
      const inlineEl = getFirstByLocalName(element, 'inline');
      if (inlineEl) {
        const cx = parseIntAttr(inlineEl, 'extentCx') || parseIntAttr(inlineEl, 'cx') || 0;
        const cy = parseIntAttr(inlineEl, 'extentCy') || parseIntAttr(inlineEl, 'cy') || 0;
        if (cx > 0) width = Math.round(cx / 914400);
        if (cy > 0) height = Math.round(cy / 914400);
      }

      if (!embedId) return null;

      const rel = this.docRels.get(embedId);
      if (!rel) return null;

      const imageData = this.loadImage(rel.target);
      if (!imageData) return null;

      return {
        type: 'drawing',
        id: `drawing-${Math.random().toString(36).slice(2, 9)}`,
        imageData,
        position: { type: 'inline', width, height },
      };
    } catch {
      return null;
    }
  }

  private parseVmlPicture(element: Element): Drawing | null {
    try {
      // VML <v:shape> or <v:imagedata>: r:id="rId..." or src="..."
      const imageDataEl = getFirstByLocalName(element, 'imagedata');
      const shapeEl = getFirstByLocalName(element, 'shape');

      let embedId = '';
      let src = '';

      if (imageDataEl) {
        embedId = imageDataEl.getAttribute('r:id') || imageDataEl.getAttribute('id') || '';
        src = imageDataEl.getAttribute('src') || '';
      }
      if (!embedId && shapeEl) {
        embedId = shapeEl.getAttribute('r:id') || shapeEl.getAttribute('id') || '';
        src = shapeEl.getAttribute('src') || src;
      }

      let width = 200;
      let height = 150;
      if (shapeEl) {
        const styleStr = shapeEl.getAttribute('style') || '';
        const wMatch = styleStr.match(/width:\s*([0-9.]+)(pt|px|%)/i);
        const hMatch = styleStr.match(/height:\s*([0-9.]+)(pt|px|%)/i);
        if (wMatch) width = parseFloat(wMatch[1]);
        if (hMatch) height = parseFloat(hMatch[1]);
      }

      let imageData: ImageData | null | undefined;
      if (embedId) {
        const rel = this.docRels.get(embedId);
        if (rel) imageData = this.loadImage(rel.target);
      } else if (src) {
        imageData = { id: 'vml', dataUrl: src, contentType: 'image/unknown' };
      }

      if (!imageData) return null;

      return {
        type: 'drawing',
        id: `drawing-${Math.random().toString(36).slice(2, 9)}`,
        imageData,
        position: { type: 'inline', width, height },
      };
    } catch {
      return null;
    }
  }

  private loadImage(target: string): ImageData | null {
    try {
      // Resolve image path relative to word/
      let imagePath = target;
      if (!target.startsWith('/') && !target.includes(':')) {
        // Relative path — resolve from word/
        imagePath = `word/${target}`;
      } else if (target.startsWith('/')) {
        imagePath = target.slice(1);
      }

      // Also try without word/ prefix
      const imagePart = this.zipPackage.getPart(imagePath)
        || this.zipPackage.getPart(target)
        || this.zipPackage.getPart('word/' + target);

      if (!imagePart) return null;

      const bytes = new Uint8Array(imagePart.data);
      const contentType = imagePart.contentType || this.inferContentType(target);

      // Build base64 data URL
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      const dataUrl = `data:${contentType};base64,${base64}`;

      return {
        id: imagePath,
        dataUrl,
        contentType,
      };
    } catch {
      return null;
    }
  }

  private inferContentType(target: string): string {
    const lower = target.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.bmp')) return 'image/bmp';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    return 'image/png';
  }

  // ─── Table ───────────────────────────────────────────────────────────────────

  private parseTable(element: Element): Table {
    const tblPr = getFirstByLocalName(element, 'tblPr');

    // Table width
    let width: number | undefined;
    const tblWEl = tblPr ? getFirstByLocalName(tblPr, 'tblW') : null;
    if (tblWEl) {
      const tw = parseIntAttr(tblWEl, 'w:w') || parseIntAttr(tblWEl, 'w');
      const type = getAttr(tblWEl, 'w:type') || getAttr(tblWEl, 'type');
      if (tw && type === 'pct') width = Math.round(tw / 50); // 5% units → percent
      else if (tw && type === 'dxa') width = Math.round(tw / 1440 * 96); // twips → px
      else if (tw) width = tw;
    }

    // Alignment
    let alignment: TableProperties['alignment'] | undefined;
    const jcEl = tblPr ? getFirstByLocalName(tblPr, 'jc') : null;
    if (jcEl) alignment = getAttr(jcEl, 'w:val') as any;

    // Table-level borders
    const bordersEl = tblPr ? getFirstByLocalName(tblPr, 'tblBorders') : null;

    const rows: TableRow[] = [];
    for (const trEl of getChildrenByLocalName(element, 'tr')) {
      rows.push(this.parseTableRow(trEl, bordersEl));
    }

    return {
      type: 'table',
      id: `table-${Math.random().toString(36).slice(2, 9)}`,
      properties: {
        width,
        alignment,
        borders: bordersEl ? this.parseTableBorders(bordersEl) : undefined,
        margins: this.parseTableMargins(tblPr),
        shading: this.parseShading(tblPr),
      },
      rows,
    };
  }

  private parseTableRow(element: Element, tableBorders?: Element | null): TableRow {
    const trPr = getFirstByLocalName(element, 'trPr');

    const cells: TableCell[] = [];
    for (const tcEl of getChildrenByLocalName(element, 'tc')) {
      cells.push(this.parseTableCell(tcEl, tableBorders));
    }

    return {
      type: 'tableRow',
      id: `tr-${Math.random().toString(36).slice(2, 9)}`,
      properties: trPr ? {
        height: parseIntAttr(trPr, 'w:trHeight') || undefined,
        cantSplit: getAttr(trPr, 'w:cantSplit') === 'true' || getAttr(trPr, 'cantSplit') === 'true',
        tableHeader: getAttr(trPr, 'w:tblHeader') === 'true' || getAttr(trPr, 'tblHeader') === 'true',
      } : undefined,
      cells,
    };
  }

  private parseTableCell(element: Element, tableBorders?: Element | null): TableCell {
    const tcPr = getFirstByLocalName(element, 'tcPr');

    // Width (cell preferred width)
    let width: number | undefined;
    const tcWEl = tcPr ? getFirstByLocalName(tcPr, 'tcW') : null;
    if (tcWEl) {
      width = parseIntAttr(tcWEl, 'w:w') || parseIntAttr(tcWEl, 'w');
    }

    // Colspan / rowspan
    const gridSpanEl = tcPr ? getFirstByLocalName(tcPr, 'gridSpan') : null;
    const vMergeEl = tcPr ? getFirstByLocalName(tcPr, 'vMerge') : null;

    // Cell borders (may inherit from table-level)
    const tcBordersEl = tcPr ? getFirstByLocalName(tcPr, 'tcBorders') : null;

    // Vertical alignment
    let verticalAlign: TableCellProperties['verticalAlign'] | undefined;
    const vAlignEl = tcPr ? getFirstByLocalName(tcPr, 'vAlign') : null;
    if (vAlignEl) verticalAlign = getAttr(vAlignEl, 'w:val') as any;

    const blocks: Block[] = [];
    for (const pEl of getChildrenByLocalName(element, 'p')) {
      blocks.push(this.parseParagraph(pEl, blocks.length));
    }

    return {
      type: 'tableCell',
      id: `tc-${Math.random().toString(36).slice(2, 9)}`,
      properties: {
        width,
        colspan: gridSpanEl ? parseIntAttr(gridSpanEl, 'w:val') || 1 : 1,
        rowspan: vMergeEl && getAttr(vMergeEl, 'w:val') !== 'restart' ? 0 : 1,
        shading: this.parseShading(tcPr),
        borders: tcBordersEl
          ? this.parseTableCellBorders(tcBordersEl)
          : tableBorders
            ? this.parseTableCellBordersFromTable(tableBorders)
            : undefined,
        verticalAlign,
      },
      children: blocks,
    };
  }

  private parseTableBorders(el: Element): TableBorders {
    return {
      top: this.parseTableBorder(getFirstByLocalName(el, 'top')),
      bottom: this.parseTableBorder(getFirstByLocalName(el, 'bottom')),
      left: this.parseTableBorder(getFirstByLocalName(el, 'left')),
      right: this.parseTableBorder(getFirstByLocalName(el, 'right')),
      insideHorizontal: this.parseTableBorder(getFirstByLocalName(el, 'insideH')),
      insideVertical: this.parseTableBorder(getFirstByLocalName(el, 'insideV')),
    };
  }

  private parseTableBorder(el: Element | null): TableBorder | undefined {
    if (!el) return undefined;
    const style = getAttr(el, 'w:val') || getAttr(el, 'val') || 'none';
    if (style === 'none' || style === 'nil') return { style };
    return {
      style,
      color: getAttr(el, 'w:color') || getAttr(el, 'color') || '000000',
      size: parseIntAttr(el, 'w:sz') || parseIntAttr(el, 'sz') || 4,
    };
  }

  private parseTableCellBorders(el: Element): TableCellBorders {
    return {
      top: this.parseTableBorder(getFirstByLocalName(el, 'top')),
      bottom: this.parseTableBorder(getFirstByLocalName(el, 'bottom')),
      left: this.parseTableBorder(getFirstByLocalName(el, 'left')),
      right: this.parseTableBorder(getFirstByLocalName(el, 'right')),
    };
  }

  private parseTableCellBordersFromTable(el: Element): TableCellBorders {
    return {
      top: this.parseTableBorder(getFirstByLocalName(el, 'top')),
      bottom: this.parseTableBorder(getFirstByLocalName(el, 'bottom')),
      left: this.parseTableBorder(getFirstByLocalName(el, 'left')),
      right: this.parseTableBorder(getFirstByLocalName(el, 'right')),
    };
  }

  private parseTableMargins(tblPr: Element | null): TableMargins | undefined {
    if (!tblPr) return undefined;
    const el = getFirstByLocalName(tblPr, 'tblMar');
    if (!el) return undefined;
    return {
      top: parseIntAttr(el, 'w:top') || parseIntAttr(el, 'top'),
      bottom: parseIntAttr(el, 'w:bottom') || parseIntAttr(el, 'bottom'),
      left: parseIntAttr(el, 'w:left') || parseIntAttr(el, 'left'),
      right: parseIntAttr(el, 'w:right') || parseIntAttr(el, 'right'),
    };
  }

  private parseShading(el: Element | null): Shading | undefined {
    if (!el) return undefined;
    const shdEl = getFirstByLocalName(el, 'shd');
    if (!shdEl) return undefined;
    return {
      fill: getAttr(shdEl, 'w:fill') || getAttr(shdEl, 'fill'),
      color: getAttr(shdEl, 'w:color') || getAttr(shdEl, 'color'),
      pattern: getAttr(shdEl, 'w:val') || getAttr(shdEl, 'val'),
    };
  }

  private parseSectionProperties(el: Element | null): any {
    return {};
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAttr(el: Element | null, name: string): string {
  return el?.getAttribute(name) || '';
}

function parseIntAttr(el: Element | null, name: string): number {
  const v = el?.getAttribute(name);
  if (v === null || v === undefined) return 0;
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}
