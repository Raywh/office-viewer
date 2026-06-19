import {
  ZipPackage,
  getFirstByLocalName,
  getAllByLocalName,
  getChildrenByLocalName,
} from '@office-viewer/core';

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

async function parseWorkbook(data: ArrayBuffer): Promise<Workbook> {
  const zipPackage = await ZipPackage.create(data);
  const workbook: Workbook = {
    sheets: [],
    definedNames: new Map(),
  };

  // Parse shared strings
  const sharedStrings: string[] = [];
  const sharedStringsPart = zipPackage.getPart('xl/sharedStrings.xml');
  if (sharedStringsPart) {
    const xml = sharedStringsPart.getXml();
    const siNodes = getAllByLocalName(xml, 'si');
    for (const siNode of siNodes) {
      const tChildren = getAllByLocalName(siNode, 't');
      if (tChildren.length > 0) {
        sharedStrings.push(tChildren.map(n => n.textContent || '').join(''));
      } else {
        const rChildren = getAllByLocalName(siNode, 'r');
        if (rChildren.length > 0) {
          const parts: string[] = [];
          for (const rNode of rChildren) {
            const tNode = getFirstByLocalName(rNode, 't');
            if (tNode) parts.push(tNode.textContent || '');
          }
          sharedStrings.push(parts.join(''));
        } else {
          sharedStrings.push(siNode.textContent || '');
        }
      }
    }
  }

  // Get sheet list
  const workbookPart = zipPackage.getPart('xl/workbook.xml');
  if (workbookPart) {
    const xml = workbookPart.getXml();
    const sheetsParent = getFirstByLocalName(xml, 'sheets');
    const sheetNodes = sheetsParent
      ? getChildrenByLocalName(sheetsParent, 'sheet')
      : getAllByLocalName(xml, 'sheet');

    for (let i = 0; i < sheetNodes.length; i++) {
      const sheetNode = sheetNodes[i];
      const name = sheetNode.getAttribute('name') || `Sheet${i + 1}`;

      // Try to locate worksheet XML via relationship or by predictable path
      let sheetPart = null;
      const rId = sheetNode.getAttribute('r:id') ||
                   sheetNode.getAttribute('rId') ||
                   sheetNode.getAttribute('id');
      if (rId) {
        const relsPart = zipPackage.getPart('xl/_rels/workbook.xml.rels');
        if (relsPart) {
          const relsXml = relsPart.getXml();
          const relNodes = getAllByLocalName(relsXml, 'Relationship');
          for (const relNode of relNodes) {
            if (relNode.getAttribute('Id') === rId) {
              const target = relNode.getAttribute('Target') || '';
              const fullPath = target.startsWith('/')
                ? target.slice(1)
                : `xl/${target}`;
              sheetPart = zipPackage.getPart(fullPath);
              break;
            }
          }
        }
      }
      if (!sheetPart) {
        sheetPart = zipPackage.getPart(`xl/worksheets/sheet${i + 1}.xml`);
      }

      const rows: string[][] = [];
      if (sheetPart) {
        const sheetXml = sheetPart.getXml();
        const sheetData = getFirstByLocalName(sheetXml, 'sheetData');
        if (sheetData) {
          const rowNodes = getChildrenByLocalName(sheetData, 'row');
          for (const rowNode of rowNodes) {
            const cells: string[] = [];
            const cellNodes = getChildrenByLocalName(rowNode, 'c');
            for (const cellNode of cellNodes) {
              const t = cellNode.getAttribute('t');
              const vNode = getFirstByLocalName(cellNode, 'v');
              const isNode = getFirstByLocalName(cellNode, 'is');
              let value = '';
              if (isNode) {
                const tNodes = getAllByLocalName(isNode, 't');
                value = tNodes.map(n => n.textContent || '').join('');
              } else if (vNode) {
                const v = vNode.textContent || '';
                if (t === 's') {
                  const idx = parseInt(v, 10);
                  if (!isNaN(idx) && idx >= 0 && idx < sharedStrings.length) {
                    value = sharedStrings[idx];
                  } else {
                    value = v;
                  }
                } else if (t === 'str' || t === 'n' || t === 'b' || !t) {
                  value = v;
                } else if (t === 'inlineStr') {
                  value = v;
                } else {
                  value = v;
                }
              }
              cells.push(value);
            }
            if (cells.some(c => c && c.length > 0) || cells.length > 0) {
              rows.push(cells);
            }
          }
        }
      }

      workbook.sheets.push({ name, rows });
    }
  }

  return workbook;
}

export async function parseExcelWorkbook(data: ArrayBuffer): Promise<Workbook> {
  return await parseWorkbook(data);
}

export function mountExcel(container: HTMLElement, workbook: Workbook): void {
  container.innerHTML = '';

  if (!workbook.sheets.length) {
    container.innerHTML = '<div style="padding: 20px;">未找到工作表</div>';
    return;
  }

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'excel-sheet-tabs';
  tabsContainer.style.cssText = 'display: flex; border-bottom: 1px solid #cbd5e1; background: #f1f5f9; margin-top: 0; padding-top: 8px; padding-left: 8px;';

  const sheetContainer = document.createElement('div');
  sheetContainer.className = 'excel-sheet-container';
  sheetContainer.style.cssText = 'background: white; padding: 16px; overflow: auto;';

  workbook.sheets.forEach((sheet, i) => {
    const tab = document.createElement('button');
    tab.textContent = sheet.name;
    tab.style.cssText = 'padding: 6px 16px; background: white; border: 1px solid #cbd5e1; border-bottom: none; margin-right: 4px; cursor: pointer; font-size: 13px; border-radius: 4px 4px 0 0;';
    if (i === 0) {
      tab.style.background = 'white';
      tab.style.fontWeight = '600';
    } else {
      tab.style.background = '#e2e8f0';
    }
    tab.addEventListener('click', () => {
      sheetContainer.innerHTML = '';
      renderSheet(sheet, sheetContainer);
      tabsContainer.querySelectorAll('button').forEach(b => {
        (b as HTMLButtonElement).style.fontWeight = '400';
        (b as HTMLButtonElement).style.background = '#e2e8f0';
      });
      tab.style.fontWeight = '600';
      tab.style.background = 'white';
    });
    tabsContainer.appendChild(tab);
  });

  renderSheet(workbook.sheets[0], sheetContainer);

  container.appendChild(tabsContainer);
  container.appendChild(sheetContainer);
}

function renderSheet(sheet: { name: string; rows: string[][] }, container: HTMLElement): void {
  if (!sheet.rows.length) {
    container.innerHTML = '<div style="padding: 16px; color: #64748b;">此工作表为空</div>';
    return;
  }

  // Compute max column count
  let maxCols = 0;
  for (const row of sheet.rows) {
    if (row.length > maxCols) maxCols = row.length;
  }

  const table = document.createElement('table');
  table.style.cssText = 'border-collapse: collapse; font-size: 13px;';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.style.cssText = 'background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; min-width: 40px;';
  headRow.appendChild(corner);
  for (let c = 0; c < maxCols; c++) {
    const th = document.createElement('th');
    th.textContent = columnName(c);
    th.style.cssText = 'background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; min-width: 100px; font-weight: 600;';
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let r = 0; r < sheet.rows.length; r++) {
    const tr = document.createElement('tr');
    const rowH = document.createElement('td');
    rowH.textContent = `${r + 1}`;
    rowH.style.cssText = 'background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; text-align: center; font-weight: 600;';
    tr.appendChild(rowH);

    const row = sheet.rows[r];
    for (let c = 0; c < maxCols; c++) {
      const td = document.createElement('td');
      const cellValue = row[c] || '';
      td.textContent = cellValue;
      td.style.cssText = 'border: 1px solid #cbd5e1; padding: 4px 8px; min-width: 100px; white-space: pre-wrap; word-break: break-word;';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

function columnName(col: number): string {
  let name = '';
  let n = col;
  while (true) {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return name;
}
