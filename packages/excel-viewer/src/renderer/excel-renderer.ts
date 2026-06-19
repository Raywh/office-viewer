import { Workbook, Sheet, Worksheet, SheetData, Row, Cell } from '../model/spreadsheet';

export interface RenderOptions {
  defaultRowHeight: number;
  defaultColumnWidth: number;
  showHeader: boolean;
  showGridLines: boolean;
  virtualScroll: boolean;
  viewportHeight: number;
}

export class ExcelRenderer {
  private options: RenderOptions;

  constructor(options?: Partial<RenderOptions>) {
    this.options = {
      defaultRowHeight: 20,
      defaultColumnWidth: 100,
      showHeader: true,
      showGridLines: true,
      virtualScroll: true,
      viewportHeight: 600,
      ...options
    };
  }

  render(workbook: Workbook, container: HTMLElement): void {
    container.innerHTML = '';

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'excel-sheet-tabs';

    const sheetContainer = document.createElement('div');
    sheetContainer.className = 'excel-sheet-container';

    workbook.sheets.forEach((sheet, index) => {
      const tab = document.createElement('button');
      tab.className = 'excel-sheet-tab';
      if (index === 0) {
        tab.classList.add('active');
      }
      tab.textContent = sheet.name;
      tab.addEventListener('click', () => {
        this.activateSheet(workbook, sheet, sheetContainer);
        document.querySelectorAll('.excel-sheet-tab').forEach(t => {
          t.classList.remove('active');
        });
        tab.classList.add('active');
      });
      tabsContainer.appendChild(tab);
    });

    if (workbook.sheets.length > 0) {
      this.renderSheet(workbook.sheets[0], sheetContainer);
    }

    container.appendChild(tabsContainer);
    container.appendChild(sheetContainer);
  }

  private activateSheet(
    _workbook: Workbook,
    sheet: Sheet,
    container: HTMLElement
  ): void {
    container.innerHTML = '';
    this.renderSheet(sheet, container);
  }

  private renderSheet(sheet: Sheet, container: HTMLElement): void {
    const worksheet = sheet.worksheet;
    const sheetData = worksheet.sheetData;

    const gridContainer = document.createElement('div');
    gridContainer.className = 'excel-grid-container';

    const cornerCell = document.createElement('div');
    cornerCell.className = 'excel-corner';
    gridContainer.appendChild(cornerCell);

    const headerRow = this.createHeaderRow(sheetData);
    gridContainer.appendChild(headerRow);

    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'excel-rows-container';

    if (this.options.virtualScroll) {
      this.renderVirtualGrid(sheetData, rowsContainer);
    } else {
      this.renderFullGrid(sheetData, rowsContainer);
    }

    gridContainer.appendChild(rowsContainer);
    container.appendChild(gridContainer);
  }

  private createHeaderRow(sheetData: SheetData): HTMLElement {
    const headerRow = document.createElement('div');
    headerRow.className = 'excel-header-row';

    const emptyCorner = document.createElement('div');
    emptyCorner.className = 'excel-header-cell';
    headerRow.appendChild(emptyCorner);

    for (let col = sheetData.minCol; col <= sheetData.maxCol; col++) {
      const headerCell = document.createElement('div');
      headerCell.className = 'excel-header-cell';
      headerCell.textContent = this.columnNumberToName(col);
      headerCell.style.minWidth = `${this.options.defaultColumnWidth}px`;
      headerCell.style.width = `${this.options.defaultColumnWidth}px`;
      headerRow.appendChild(headerCell);
    }

    return headerRow;
  }

  private renderFullGrid(sheetData: SheetData, container: HTMLElement): void {
    for (let row = sheetData.minRow; row <= sheetData.maxRow; row++) {
      const rowEl = this.createRow(sheetData, row);
      container.appendChild(rowEl);
    }
  }

  private renderVirtualGrid(sheetData: SheetData, container: HTMLElement): void {
    const totalHeight = (sheetData.maxRow - sheetData.minRow + 1) * this.options.defaultRowHeight;
    
    container.style.height = `${Math.min(totalHeight, this.options.viewportHeight)}px`;
    container.style.overflowY = 'auto';

    const spacer = document.createElement('div');
    spacer.style.height = `${totalHeight}px`;
    container.appendChild(spacer);

    const visibleContainer = document.createElement('div');
    visibleContainer.style.position = 'relative';
    container.appendChild(visibleContainer);

    const renderVisibleRows = () => {
      const scrollTop = container.scrollTop;
      const rowHeight = this.options.defaultRowHeight;
      const startRow = sheetData.minRow + Math.floor(scrollTop / rowHeight);
      const viewportRows = Math.ceil(this.options.viewportHeight / rowHeight) + 2;
      const endRow = Math.min(sheetData.maxRow, startRow + viewportRows);

      visibleContainer.innerHTML = '';
      visibleContainer.style.transform = `translateY(${Math.max(0, (startRow - sheetData.minRow) * rowHeight)}px)`;

      for (let row = startRow; row <= endRow; row++) {
        const rowEl = this.createRow(sheetData, row);
        visibleContainer.appendChild(rowEl);
      }
    };

    renderVisibleRows();
    container.addEventListener('scroll', renderVisibleRows);
  }

  private createRow(sheetData: SheetData, rowIndex: number): HTMLElement {
    const rowEl = document.createElement('div');
    rowEl.className = 'excel-row';
    rowEl.style.height = `${this.options.defaultRowHeight}px`;

    const rowHeader = document.createElement('div');
    rowHeader.className = 'excel-row-header';
    rowHeader.textContent = `${rowIndex}`;
    rowEl.appendChild(rowHeader);

    for (let col = sheetData.minCol; col <= sheetData.maxCol; col++) {
      const cellKey = `${this.columnNumberToName(col)}${rowIndex}`;
      const cell = sheetData.cells.get(cellKey);
      const cellEl = this.createCell(cell, col);
      rowEl.appendChild(cellEl);
    }

    return rowEl;
  }

  private createCell(cell: Cell | undefined, _colIndex: number): HTMLElement {
    const cellEl = document.createElement('div');
    cellEl.className = 'excel-cell';
    cellEl.style.minWidth = `${this.options.defaultColumnWidth}px`;
    cellEl.style.width = `${this.options.defaultColumnWidth}px`;

    if (this.options.showGridLines) {
      cellEl.style.border = '1px solid #d0d7de';
    }

    if (cell && cell.value) {
      const value = cell.value;
      if (value.type === 'string') {
        cellEl.textContent = value.text || '';
      } else if (value.type === 'number') {
        cellEl.textContent = `${value.number}`;
      } else if (value.type === 'boolean') {
        cellEl.textContent = value.boolean ? 'TRUE' : 'FALSE';
      } else if (value.type === 'error') {
        cellEl.textContent = value.error || '';
      }
    }

    return cellEl;
  }

  private columnNumberToName(n: number): string {
    let name = '';
    while (n > 0) {
      n--;
      name = String.fromCharCode(65 + (n % 26)) + name;
      n = Math.floor(n / 26);
    }
    return name;
  }
}
