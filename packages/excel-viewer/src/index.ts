/**
 * Excel Viewer
 * Parse and render .xls and .xlsx spreadsheets
 */

export function parseExcelWorkbook(data: ArrayBuffer, options?: any): any {
  return {};
}

export function streamExcelRows(data: ArrayBuffer, options?: any): AsyncIterable<any> {
  return (async function*() {})();
}

export function defaultExcelCss(): string {
  return '';
}

export function renderExcelHtml(workbook: any, options?: any): string {
  return '';
}

export function mountExcel(container: HTMLElement, workbook: any, options?: any): any {
  return {};
}

export function syncExcelOverlays(container: HTMLElement): void {
}

export function isOverflowTextCell(
  sheet: any,
  row: number,
  col: number,
  workbook: any
): boolean {
  return false;
}

export function getVirtualViewportRange(
  sheet: any,
  metrics: any,
  scrollState: any,
  viewport: any,
  options?: any
): any {
  return {};
}

export class ExcelWorkerClient {
  async load(data: ArrayBuffer, options?: any): Promise<any> {
    return {};
  }
}

export function createExcelWorkerClient(options?: any): ExcelWorkerClient {
  return new ExcelWorkerClient();
}

export function loadExcelWorkbookInWorker(
  data: ArrayBuffer,
  options?: any
): Promise<any> {
  return Promise.resolve({});
}
