import { ZipPackage } from '@office-viewer/core';
import {
  Workbook,
  Worksheet,
  SheetData,
  Row,
  Cell,
  Sheet
} from '../model/spreadsheet';

export interface ParseOptions {
  includeStyles?: boolean;
  includeCharts?: boolean;
}

export class ExcelParser {
  private zipPackage: ZipPackage;
  private options: ParseOptions;
  private sharedStrings: string[] = [];

  constructor(zipPackage: ZipPackage, options: ParseOptions = {}) {
    this.zipPackage = zipPackage;
    this.options = options;
  }

  async parse(): Promise<Workbook> {
    await this.loadSharedStrings();
    
    const workbookPart = this.zipPackage.getPart('xl/workbook.xml');
    const sheets: Sheet[] = [];

    if (workbookPart) {
      const workbookXml = this.parseXml(workbookPart.getText());
      const sheetEls = workbookXml.querySelectorAll('sheet');
      
      for (let i = 0; i < sheetEls.length; i++) {
        const sheetEl = sheetEls[i];
        const name = sheetEl.getAttribute('name') || `Sheet${i + 1}`;
        const relId = sheetEl.getAttribute('r:id') || sheetEl.getAttribute('rId');
        const id = sheetEl.getAttribute('sheetId') || `${i}`;
        
        const worksheet = await this.parseWorksheet(`xl/worksheets/sheet${i + 1}.xml`);
        
        sheets.push({
          id: id,
          name: name,
          worksheet: worksheet
        });
      }
    }

    return {
      sheets: sheets,
      definedNames: new Map()
    };
  }

  private async loadSharedStrings(): Promise<void> {
    const sharedStringsPart = this.zipPackage.getPart('xl/sharedStrings.xml');
    
    if (!sharedStringsPart) return;
    
    const xml = this.parseXml(sharedStringsPart.getText());
    const siEls = xml.querySelectorAll('si');
    
    siEls.forEach(siEl => {
      const tEl = siEl.querySelector('t');
      if (tEl) {
        this.sharedStrings.push(tEl.textContent || '');
      } else {
        const rEls = siEl.querySelectorAll('r');
        const parts: string[] = [];
        rEls.forEach(rEl => {
          const rtEl = rEl.querySelector('t');
          if (rtEl) {
            parts.push(rtEl.textContent || '');
          }
        });
        this.sharedStrings.push(parts.join(''));
      }
    });
  }

  private async parseWorksheet(path: string): Promise<Worksheet> {
    const sheetPart = this.zipPackage.getPart(path);
    
    if (!sheetPart) {
      return {
        sheetData: {
          rows: [],
          cells: new Map(),
          minRow: 1,
          maxRow: 1,
          minCol: 1,
          maxCol: 1
        }
      };
    }

    const worksheetXml = this.parseXml(sheetPart.getText());
    const sheetDataEl = worksheetXml.querySelector('sheetData');
    
    const rows: Row[] = [];
    const cells = new Map<string, Cell>();
    
    if (sheetDataEl) {
      const rowEls = sheetDataEl.querySelectorAll('row');
      
      rowEls.forEach(rowEl => {
        const row = this.parseRow(rowEl);
        rows.push(row);
        
        row.cells.forEach(cell => {
          cells.set(cell.ref, cell);
        });
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
      sheetData: {
        rows: rows,
        cells: cells,
        minRow: minRow,
        maxRow: maxRow,
        minCol: minCol,
        maxCol: maxCol
      }
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
    const cellEls = element.querySelectorAll('c');
    
    cellEls.forEach(cellEl => {
      const cell = this.parseCell(cellEl);
      cells.push(cell);
    });
    
    return {
      index: index,
      height: height,
      customHeight: customHeight,
      hidden: hidden,
      cells: cells
    };
  }

  private parseCell(element: Element): Cell {
    const ref = element.getAttribute('r') || '';
    const { row, col } = this.parseRef(ref);
    const type = element.getAttribute('t');
    const sAttr = element.getAttribute('s');
    const s = sAttr ? parseInt(sAttr, 10) : undefined;
    
    const vEl = element.querySelector('v');
    let value;
    
    if (vEl) {
      const text = vEl.textContent || '';
      
      if (type === 's') {
        const index = parseInt(text, 10);
        value = {
          type: 'string',
          text: this.sharedStrings[index] || text
        };
      } else if (type === 'b') {
        value = {
          type: 'boolean',
          boolean: text === '1'
        };
      } else if (type === 'e') {
        value = {
          type: 'error',
          error: text
        };
      } else {
        value = {
          type: 'number',
          number: parseFloat(text)
        };
      }
    }

    return {
      ref: ref,
      row: row,
      col: col,
      cellType: type as any,
      value: value,
      s: s
    };
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
      
      return {
        row: parseInt(rowPart, 10),
        col: col
      };
    }
    
    return { row: 1, col: 1 };
  }

  private parseXml(xmlText: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xmlText, 'text/xml');
  }
}
