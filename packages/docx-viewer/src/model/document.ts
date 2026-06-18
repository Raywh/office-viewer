export interface WordDocument {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  created?: Date;
  modified?: Date;
  sections: Section[];
  relationships: Map<string, Relationship>;
}

export interface Relationship {
  id: string;
  type: string;
  target: string;
}

export interface Section {
  id: string;
  properties: SectionProperties;
  header?: HeaderFooter;
  footer?: HeaderFooter;
  children: Block[];
}

export interface SectionProperties {
  pageSize?: PageSize;
  pageMargin?: PageMargin;
  pageOrientation?: 'portrait' | 'landscape';
  columns?: Columns;
}

export interface PageSize {
  width: number;
  height: number;
}

export interface PageMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
  header: number;
  footer: number;
  gutter: number;
}

export interface Columns {
  count: number;
  space?: number;
  equalWidth?: boolean;
}

export interface HeaderFooter {
  id: string;
  type: 'default' | 'first' | 'even';
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
  alignment?: 'left' | 'center' | 'right' | 'both';
  spacing?: Spacing;
  indentation?: Indentation;
  shading?: Shading;
  numbering?: NumberingInfo;
}

export interface Spacing {
  before?: number;
  after?: number;
  line?: number;
  lineRule?: 'auto' | 'exact' | 'atLeast';
}

export interface Indentation {
  left?: number;
  right?: number;
  hanging?: number;
  firstLine?: number;
}

export interface Shading {
  fill?: string;
  color?: string;
  pattern?: string;
}

export interface NumberingInfo {
  id: string;
  level: number;
}

export type Inline = Run | Drawing | Tab | Break;

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
  underline?: Underline;
  strike?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  size?: number;
  color?: string;
  highlight?: string;
  font?: string;
}

export interface Underline {
  color?: string;
  style: string;
}

export interface Text {
  type: 'text';
  content: string;
}

export interface Tab {
  type: 'tab';
}

export interface Break {
  type: 'break';
  breakType: 'line' | 'page' | 'column';
}

export interface Drawing {
  type: 'drawing';
  id: string;
  imageData?: ImageData;
  position: DrawingPosition;
}

export interface ImageData {
  id: string;
  data?: ArrayBuffer;
  contentType?: string;
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
}

export interface TableMargins {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface TableBorders {
  top?: TableBorder;
  bottom?: TableBorder;
  left?: TableBorder;
  right?: TableBorder;
  insideHorizontal?: TableBorder;
  insideVertical?: TableBorder;
}

export interface TableBorder {
  color?: string;
  size?: number;
  style: string;
}

export interface TableRow {
  type: 'tableRow';
  id: string;
  properties?: TableRowProperties;
  cells: TableCell[];
}

export interface TableRowProperties {
  height?: number;
  cantSplit?: boolean;
  tableHeader?: boolean;
}

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
