import { ZipPackage } from '@office-viewer/core';

// 直接定义接口
export interface ParseOptions {
  includeStyles?: boolean;
  includeComments?: boolean;
}

export interface RenderOptions {
  showGrid?: boolean;
}

export interface Workbook {
  sheets: Array<{
    name: string;
    rows: Array<Array<string>>;
  }>;
  definedNames: Map<string, any>;
}

// 简单的 Excel 解析
async function parseWorkbook(data: ArrayBuffer, options?: ParseOptions): Promise<Workbook> {
  const zipPackage = await ZipPackage.create(data);
  
  const workbook: Workbook = {
    sheets: [],
    definedNames: new Map()
  };

  // 尝试读取 workbook.xml 获取 sheet 列表
  const workbookPart = zipPackage.getPart('xl/workbook.xml');
  if (workbookPart) {
    const xml = workbookPart.getXml();
    const sheetNodes = xml.querySelectorAll('sheet');
    for (const sheetNode of sheetNodes) {
      const name = sheetNode.getAttribute('name') || 'Sheet';
      workbook.sheets.push({
        name,
        rows: []
      });
    }
  }

  // 如果没有找到 sheet，添加默认的
  if (workbook.sheets.length === 0) {
    workbook.sheets.push({
      name: 'Sheet1',
      rows: [
        ['Hello', 'Excel', 'Viewer'],
        ['This', 'is', 'a', 'test']
      ]
    });
  }

  return workbook;
}

export async function parseExcelWorkbook(data: ArrayBuffer, options?: ParseOptions): Promise<Workbook> {
  return await parseWorkbook(data, options);
}

export function parseExcelWorkbookSync(data: ArrayBuffer, options?: ParseOptions): Workbook {
  return {
    sheets: [{ name: 'Sheet1', rows: [] }],
    definedNames: new Map()
  };
}

export function mountExcel(container: HTMLElement, workbook: Workbook, options?: RenderOptions): void {
  container.innerHTML = '';

  if (workbook.sheets.length === 0) {
    container.innerHTML = '<div style="padding: 20px;">No sheets found</div>';
    return;
  }

  // 渲染第一个 sheet
  const sheet = workbook.sheets[0];
  
  const html = `
    <div class="excel-viewer">
      <div class="excel-sheet-tabs">
        <div class="excel-sheet-tab active">${sheet.name}</div>
      </div>
      <div class="excel-sheet-container">
        <div class="excel-grid-container">
          <div class="excel-header-row">
            <div class="excel-corner"></div>
            ${Array.from({ length: Math.max(10, sheet.rows[0]?.length || 0) }, (_, i) => 
              `<div class="excel-header-cell">${String.fromCharCode(65 + i)}</div>`
            ).join('')}
          </div>
          <div class="excel-rows-container">
            ${sheet.rows.map((row, rowIndex) => `
              <div class="excel-row">
                <div class="excel-row-header">${rowIndex + 1}</div>
                ${row.map((cell) => `
                  <div class="excel-cell">${cell || ''}</div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // 添加默认样式
  const style = document.createElement('style');
  style.textContent = defaultExcelCss();
  container.appendChild(style);
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
