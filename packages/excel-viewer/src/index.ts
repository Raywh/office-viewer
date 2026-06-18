import { ZipPackage } from '@office-viewer/core';
import { Workbook } from './model/spreadsheet';
import { ExcelParser, ParseOptions } from './parser/excel-parser';
import { ExcelRenderer, RenderOptions } from './renderer/excel-renderer';

export { Workbook };
export { ParseOptions, RenderOptions };

export function parseExcelWorkbook(data: ArrayBuffer, options?: ParseOptions): Workbook {
  const zipPackage = new ZipPackage(data);
  const parser = new ExcelParser(zipPackage, options);
  
  let result: Workbook = {
    sheets: [],
    definedNames: new Map()
  };
  
  parser.parse().then(wb => {
    result = wb;
  });
  
  return result;
}

export function mountExcel(container: HTMLElement, workbook: Workbook, options?: RenderOptions): void {
  const renderer = new ExcelRenderer(options);
  renderer.render(workbook, container);
}

export function* streamExcelRows(data: ArrayBuffer, options?: ParseOptions): AsyncIterable<any> {
}

export function defaultExcelCss(): string {
  return `
    .excel-viewer {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
    }
    
    .excel-sheet-tabs {
      display: flex;
      background: #f3f4f6;
      border-bottom: 1px solid #d1d5db;
      padding: 4px 8px 0 8px;
    }
    
    .excel-sheet-tab {
      padding: 6px 16px;
      background: white;
      border: 1px solid #d1d5db;
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      margin-right: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .excel-sheet-tab.active {
      background: white;
      border-bottom: 1px solid white;
      margin-bottom: -1px;
    }
    
    .excel-sheet-container {
      overflow: hidden;
    }
    
    .excel-grid-container {
      display: flex;
      flex-direction: column;
    }
    
    .excel-header-row {
      display: flex;
      background: #f3f4f6;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .excel-header-cell {
      min-width: 100px;
      width: 100px;
      padding: 4px 8px;
      border-right: 1px solid #d1d5db;
      border-bottom: 1px solid #d1d5db;
      text-align: center;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .excel-corner {
      width: 40px;
      min-width: 40px;
      background: #f3f4f6;
      border-right: 1px solid #d1d5db;
      border-bottom: 1px solid #d1d5db;
      flex-shrink: 0;
    }
    
    .excel-rows-container {
      overflow-y: auto;
      max-height: 600px;
    }
    
    .excel-row {
      display: flex;
    }
    
    .excel-row-header {
      width: 40px;
      min-width: 40px;
      background: #f3f4f6;
      border-right: 1px solid #d1d5db;
      border-bottom: 1px solid #d1d5db;
      padding: 4px 8px;
      text-align: center;
      font-weight: 600;
      flex-shrink: 0;
      position: sticky;
      left: 0;
      z-index: 5;
    }
    
    .excel-cell {
      min-width: 100px;
      width: 100px;
      padding: 4px 8px;
      border-right: 1px solid #d0d7de;
      border-bottom: 1px solid #d0d7de;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-shrink: 0;
    }
  `;
}

export function renderExcelHtml(workbook: Workbook, options?: RenderOptions): string {
  return `<div class="excel-viewer">${workbook.sheets.map(s => `<div>${s.name}</div>`).join('')}</div>`;
}

export function syncExcelOverlays(container: HTMLElement): void {
}

export function isOverflowTextCell(
  sheet: any,
  row: number,
  col: number,
  workbook: Workbook
): boolean {
  return false;
}

export function getVirtualViewportRange(
  sheet: any,
  metrics: any,
  scrollState: any,
  viewport: any,
  options?: RenderOptions
): any {
  return {};
}

export class ExcelWorkerClient {
  async load(data: ArrayBuffer, options?: ParseOptions): Promise<Workbook> {
    return parseExcelWorkbook(data, options);
  }
}

export function createExcelWorkerClient(options?: any): ExcelWorkerClient {
  return new ExcelWorkerClient();
}

export function loadExcelWorkbookInWorker(
  data: ArrayBuffer,
  options?: ParseOptions
): Promise<Workbook> {
  return Promise.resolve(parseExcelWorkbook(data, options));
}
