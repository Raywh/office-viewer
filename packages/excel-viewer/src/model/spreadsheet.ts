export interface Workbook {
  sheets: Sheet[];
  definedNames: Map<string, DefinedName>;
  properties?: WorkbookProperties;
}

export interface WorkbookProperties {
  title?: string;
  author?: string;
  created?: Date;
  modified?: Date;
  application?: string;
}

export interface DefinedName {
  name: string;
  refersTo: string;
  sheetId?: string;
}

export interface Sheet {
  id: string;
  name: string;
  worksheet: Worksheet;
}

export interface Worksheet {
  dimension?: WorksheetDimension;
  sheetData: SheetData;
  mergeCells?: MergeCell[];
  cols?: Column[];
  rowBreaks?: PageBreak[];
  colBreaks?: PageBreak[];
  views?: SheetView[];
  hyperlinks?: Hyperlink[];
}

export interface WorksheetDimension {
  ref: string;
  minRow: number;
  minCol: number;
  maxRow: number;
  maxCol: number;
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
  height?: number;
  customHeight?: boolean;
  hidden?: boolean;
  cells: Cell[];
}

export interface Cell {
  ref: string;
  row: number;
  col: number;
  cellType?: 'b' | 'n' | 'e' | 's' | 'inlineStr' | 'str';
  value?: CellValue;
  styleIndex?: number;
  s?: number;
}

export interface CellValue {
  type: 'string' | 'number' | 'boolean' | 'error' | 'inlineString';
  text?: string;
  number?: number;
  boolean?: boolean;
  error?: string;
}

export interface Column {
  min: number;
  max: number;
  width?: number;
  hidden?: boolean;
  styleIndex?: number;
  customWidth?: boolean;
}

export interface MergeCell {
  ref: string;
  refStart: string;
  refEnd: string;
}

export interface PageBreak {
  id: number;
  ref: string;
}

export interface SheetView {
  zoomScale?: number;
  showGridLines?: boolean;
}

export interface Hyperlink {
  ref: string;
  location?: string;
  display?: string;
  target?: string;
}

export interface CellStyles {
  cellStyles: CellStyle[];
}

export interface CellStyle {
  xfId: number;
  name?: string;
}

export interface Stylesheet {
  numberFormats: NumberFormat[];
  fonts: Font[];
  fills: Fill[];
  borders: Border[];
  cellXfs: CellXf[];
}

export interface NumberFormat {
  id: number;
  formatCode?: string;
}

export interface Font {
  size?: number;
  name?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: Color;
}

export interface Fill {
  patternFill?: PatternFill;
}

export interface PatternFill {
  patternType?: string;
  fgColor?: Color;
  bgColor?: Color;
}

export interface Border {
  left?: BorderItem;
  right?: BorderItem;
  top?: BorderItem;
  bottom?: BorderItem;
  diagonal?: BorderItem;
  diagonalUp?: boolean;
  diagonalDown?: boolean;
}

export interface BorderItem {
  style?: string;
  color?: Color;
}

export interface Color {
  auto?: boolean;
  rgb?: string;
  theme?: number;
  tint?: number;
  indexed?: number;
}

export interface CellXf {
  numFmtId?: number;
  fontId?: number;
  fillId?: number;
  borderId?: number;
  alignment?: CellAlignment;
  applyNumberFormat?: boolean;
  applyFont?: boolean;
  applyFill?: boolean;
  applyBorder?: boolean;
  applyAlignment?: boolean;
}

export interface CellAlignment {
  horizontal?: 'general' | 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed';
  vertical?: 'top' | 'center' | 'bottom' | 'justify' | 'distributed';
  textRotation?: number;
  wrapText?: boolean;
  indent?: number;
  relativeIndent?: number;
  justifyLastLine?: boolean;
  shrinkToFit?: boolean;
  readingOrder?: number;
}
