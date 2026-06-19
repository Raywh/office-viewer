import {
  ZipPackage,
  getFirstByLocalName,
  getAllByLocalName,
  getChildrenByLocalName,
} from '@office-viewer/core';

export interface ParseOptions {
  includeStyles?: boolean;
  includeCharts?: boolean;
}

export interface Workbook {
  sheets: Sheet[];
  definedNames: Map<string, any>;
}

export interface Sheet {
  id: string;
  name: string;
  worksheet: Worksheet;
}

export interface Worksheet {
  sheetData: SheetData;
}

export interface SheetData {
  rows: Row[];
  cells: Map<string, Cell>;
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

export interface Row {
  index: number;
  cells: Cell[];
  hidden?: boolean;
  height?: number;
  customHeight?: boolean;
}

export interface Cell {
  ref: string;
  row: number;
  col: number;
  cellType?: string;
  value?: any;
  s?: number;
}

export class ExcelParser {
  private zipPackage: ZipPackage;
  private options: ParseOptions;
  private sharedStrings: string[] = [];

  constructor(zipPackage: ZipPackage, options: ParseOptions = {}) {
    this.zipPackage = zipPackage;
    this.options = options;
  }

  static async create(data: ArrayBuffer, options: ParseOptions = {}): Promise<ExcelParser> {
    const zipPackage = await ZipPackage.create(data);
    return new ExcelParser(zipPackage, options);
  }

  async parse(): Promise<Workbook> {
    await this.loadSharedStrings();
    const workbookPart = this.zipPackage.getPart('xl/workbook.xml');
    const sheets: Sheet[] = [];

    if (workbookPart) {
      const xml = workbookPart.getXml();
      const sheetsContainer = getFirstByLocalName(xml, 'sheets');
      const sheetNodes = sheetsContainer
        ? getChildrenByLocalName(sheetsContainer, 'sheet')
        : getAllByLocalName(xml, 'sheet');

      for (let i = 0; i < sheetNodes.length; i++) {
        const sheetNode = sheetNodes[i];
        const name = sheetNode.getAttribute('name') || `Sheet${i + 1}`;
        const rId = sheetNode.getAttribute('r:id') ||
                    sheetNode.getAttribute('rId') ||
                    sheetNode.getAttribute('id');

        let worksheet: Worksheet = {
          sheetData: {
            rows: [],
            cells: new Map(),
            minRow: 1,
            maxRow: 1,
            minCol: 1,
            maxCol: 1,
          },
        };

        const relsPart = this.zipPackage.getPart('xl/_rels/workbook.xml.rels');
        if (relsPart && rId) {
          const relsXml = relsPart.getXml();
          const relNodes = getAllByLocalName(relsXml, 'Relationship');
          for (const relNode of relNodes) {
            if (relNode.getAttribute('Id') === rId) {
              const target = relNode.getAttribute('Target') || '';
              const fullPath = target.startsWith('/')
                ? target.slice(1)
                : `xl/${target}`;
              const sheetPart = this.zipPackage.getPart(fullPath);
              if (sheetPart) {
                worksheet = this.parseWorksheetXml(sheetPart.getXml());
              }
              break;
            }
          }
        } else {
          const sheetPart = this.zipPackage.getPart(`xl/worksheets/sheet${i + 1}.xml`);
          if (sheetPart) {
            worksheet = this.parseWorksheetXml(sheetPart.getXml());
          }
        }

        sheets.push({ id: `${i}`, name, worksheet });
      }
    }

    return { sheets, definedNames: new Map() };
  }

  private async loadSharedStrings(): Promise<void> {
    const sharedStringsPart = this.zipPackage.getPart('xl/sharedStrings.xml');
    if (!sharedStringsPart) return;

    const xml = sharedStringsPart.getXml();
    const siNodes = getAllByLocalName(xml, 'si');
    for (const siNode of siNodes) {
      const tChildren = getAllByLocalName(siNode, 't');
      if (tChildren.length > 0) {
        this.sharedStrings.push(tChildren.map(n => n.textContent || '').join(''));
        continue;
      }
      const rChildren = getAllByLocalName(siNode, 'r');
      if (rChildren.length > 0) {
        const parts: string[] = [];
        for (const rNode of rChildren) {
          const tNode = getFirstByLocalName(rNode, 't');
          if (tNode) parts.push(tNode.textContent || '');
        }
        this.sharedStrings.push(parts.join(''));
        continue;
      }
      this.sharedStrings.push(siNode.textContent || '');
    }
  }

  private parseWorksheetXml(sheetXml: Document): Worksheet {
    const sheetData = getFirstByLocalName(sheetXml, 'sheetData');
    const rows: Row[] = [];
    const cells = new Map<string, Cell>();

    if (sheetData) {
      const rowNodes = getChildrenByLocalName(sheetData, 'row');
      rowNodes.forEach(rowNode => {
        const row = this.parseRow(rowNode);
        rows.push(row);
        row.cells.forEach(cell => cells.set(cell.ref, cell));
      });
    }

    const minRow = rows.length > 0 ? Math.min(...rows.map(r => r.index)) : 1;
    const maxRow = rows.length > 0 ? Math.max(...rows.map(r => r.index)) : 1;
    let minCol = 1;
    let maxCol = 1;
    for (const row of rows) {
      for (const cell of row.cells) {
        minCol = Math.min(minCol, cell.col);
        maxCol = Math.max(maxCol, cell.col);
      }
    }

    return {
      sheetData: { rows, cells, minRow, maxRow, minCol, maxCol },
    };
  }

  private parseRow(element: Element): Row {
    const indexAttr = element.getAttribute('r');
    const index = indexAttr ? parseInt(indexAttr, 10) : 0;
    const heightAttr = element.getAttribute('ht');
    const height = heightAttr ? parseFloat(heightAttr) : undefined;
    const customHeight = element.getAttribute('customHeight') === '1';
    const hidden = element.getAttribute('hidden') === '1';

    const cells: Cell[] = [];
    const cellNodes = getChildrenByLocalName(element, 'c');
    cellNodes.forEach(cellNode => {
      cells.push(this.parseCell(cellNode));
    });

    return { index, cells, height, customHeight, hidden };
  }

  private parseCell(element: Element): Cell {
    const ref = element.getAttribute('r') || '';
    const { row, col } = this.parseRef(ref);
    const cellType = element.getAttribute('t') || undefined;
    const sAttr = element.getAttribute('s');
    const s = sAttr ? parseInt(sAttr, 10) : undefined;

    const vNode = getFirstByLocalName(element, 'v');
    const isNode = getFirstByLocalName(element, 'is');
    let value: any;

    if (isNode) {
      const tNodes = getAllByLocalName(isNode, 't');
      value = { type: 'string', text: tNodes.map(n => n.textContent || '').join('') };
    } else if (vNode) {
      const v = vNode.textContent || '';
      if (cellType === 's') {
        const idx = parseInt(v, 10);
        const text = (!isNaN(idx) && idx >= 0 && idx < this.sharedStrings.length)
          ? this.sharedStrings[idx]
          : v;
        value = { type: 'string', text };
      } else if (cellType === 'b') {
        value = { type: 'boolean', boolean: v === '1' };
      } else if (cellType === 'e') {
        value = { type: 'error', error: v };
      } else {
        value = { type: 'number', number: parseFloat(v) };
      }
    }

    return { ref, row, col, cellType, value, s };
  }

  private parseRef(ref: string): { row: number; col: number } {
    const match = ref.match(/^([A-Z]+)([0-9]+)$/);
    if (match) {
      const colPart = match[1];
      const rowPart = match[2];
      let col = 0;
      for (let i = 0; i < colPart.length; i++) {
        col = col * 26 + (colPart.charCodeAt(i) - 64);
      }
      return { row: parseInt(rowPart, 10), col };
    }
    return { row: 1, col: 1 };
  }
}
