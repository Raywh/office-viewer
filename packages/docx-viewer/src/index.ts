import {
  DocumentParser,
  WordDocument,
  Section,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  Run,
  Drawing,
  Hyperlink,
  TabChar,
  Break,
  Text,
  ParagraphProperties,
  TableProperties,
  TableBorders,
  TableCellBorders,
  TableBorder,
  Shading,
  NumberingInfo,
} from './parser/document-parser';

export { DocumentParser };
export type {
  WordDocument,
  Section,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  Run,
  Drawing,
  Hyperlink,
  TabChar,
  Break,
  Text,
  ParagraphProperties,
  TableProperties,
  TableBorders,
  TableCellBorders,
  TableBorder,
  Shading,
  NumberingInfo,
};

export async function parseDocument(data: ArrayBuffer) {
  const parser = await DocumentParser.create(data);
  return parser.parse();
}

function runPropsToCss(props: Run['properties']): string {
  const styles: string[] = [];
  if (props.bold)        styles.push('font-weight: 700');
  if (props.italic)       styles.push('font-style: italic');
  if (props.underline)    styles.push('text-decoration: underline');
  if (props.strike)       styles.push('text-decoration: line-through');
  if (props.subscript)    styles.push('vertical-align: sub; font-size: 0.8em');
  if (props.superscript) styles.push('vertical-align: super; font-size: 0.8em');
  if (props.size)         styles.push(`font-size: ${props.size}pt`);
  if (props.color && props.color !== 'auto') styles.push(`color: #${props.color}`);
  if (props.font)        styles.push(`font-family: '${props.font}', sans-serif`);
  if (props.highlight && props.highlight !== 'none') {
    const hl = highlightColor(props.highlight);
    if (hl) styles.push(`background: ${hl}`);
  }
  return styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
}

function highlightColor(code: string): string {
  // Standard Word highlight color codes
  const map: Record<string, string> = {
    yellow: '#ffff00', darkyellow: '#808000', green: '#00ff00',
    darkgreen: '#008000', cyan: '#00ffff', darkcyan: '#008080',
    magenta: '#ff00ff', darkmagenta: '#800080', blue: '#0000ff',
    darkblue: '#000080', red: '#ff0000', darkred: '#800000',
    white: '#ffffff', black: '#000000',
  };
  return map[code.toLowerCase()] || code;
}

// ─── Inline renderers ────────────────────────────────────────────────────────

function renderText(text: Text): string {
  return escapeHtml(text.content);
}

function renderTab(): string {
  return '&nbsp;&nbsp;&nbsp;&nbsp;';
}

function renderBreak(b: Break): string {
  if (b.breakType === 'page') return '<br style="page-break-after: always;">';
  return '<br>';
}

function renderHyperlink(h: Hyperlink, childrenHtml: string): string {
  const href = h.target.startsWith('http') ? h.target : '#';
  const title = h.target;
  return `<a href="${href}" title="${escapeAttr(title)}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${childrenHtml}</a>`;
}

function renderDrawing(d: Drawing): string {
  if (!d.imageData?.dataUrl) return '';
  const { dataUrl, widthPx, heightPx } = d.imageData;
  const w = d.position.width || widthPx || 200;
  const h = d.position.height || heightPx || 150;
  return `<img src="${dataUrl}" alt="图片" style="max-width: 100%; height: auto; display: block; margin: 8px 0; border: 1px solid #e2e8f0; border-radius: 4px;" width="${w}" height="${h}">`;
}

function renderInline(inline: Run | Drawing | TabChar | Break | Hyperlink): string {
  switch (inline.type) {
    case 'run': {
      const run = inline as Run;
      const childrenHtml = run.children.map(c =>
        c.type === 'text' ? renderText(c) : ''
      ).join('');
      return `<span${runPropsToCss(run.properties)}>${childrenHtml}</span>`;
    }
    case 'tab':     return renderTab();
    case 'break':   return renderBreak(inline as Break);
    case 'drawing': return renderDrawing(inline as Drawing);
    case 'hyperlink': {
      const h = inline as Hyperlink;
      const childrenHtml = h.children.map(renderInline).join('');
      return renderHyperlink(h, childrenHtml);
    }
    default: return '';
  }
}

function renderParagraphChildren(inlines: (Run | Drawing | TabChar | Break | Hyperlink)[]): string {
  return inlines.map(renderInline).join('');
}

// ─── Numbering (list) ────────────────────────────────────────────────────────

function getListMarker(props: ParagraphProperties): string {
  const num = props.numbering;
  if (!num) return '';

  const lvl = num.level ?? 0;
  const fmt = num.numFmt ?? 'decimal';

  const bullet = getBulletChar(fmt, lvl);
  const paddingLeft = Math.round(lvl * 24); // indent per level
  const hanging = 24;

  return `<span class="list-marker" data-bullet="${escapeAttr(bullet)}" style="display: inline-block; width: ${paddingLeft + hanging}px; text-align: ${hanging}px; vertical-align: top;">${escapeHtml(bullet)}</span>`;
}

function getBulletChar(fmt: string, level: number): string {
  if (fmt === 'bullet') {
    const bullets = ['•', '◦', '▪', '▸', '▹', '→', '⇒', '★', '◆', '◇'];
    return bullets[level % bullets.length];
  }
  if (fmt === 'decimal' || fmt === '1') return '1.';
  if (fmt === 'lowerLetter' || fmt === 'a') return String.fromCharCode(97 + level) + '.';
  if (fmt === 'upperLetter' || fmt === 'A') return String.fromCharCode(65 + level) + '.';
  if (fmt === 'lowerRoman' || fmt === 'i') {
    const roman = toRoman(level + 1);
    return roman.toLowerCase() + '.';
  }
  if (fmt === 'upperRoman' || fmt === 'I') return toRoman(level + 1) + '.';
  return '•';
}

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let out = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { out += syms[i]; n -= vals[i]; }
  }
  return out;
}

// ─── Paragraph renderers ─────────────────────────────────────────────────────

function renderParagraph(p: Paragraph): string {
  const marker = getListMarker(p.properties);
  const markerHtml = marker
    ? `<span class="list-marker-wrapper" style="display: flex; align-items: baseline;">${marker}</span>`
    : '';
  const inlinesHtml = renderParagraphChildren(p.children as any);
  const pStyles: string[] = ['margin: 6px 0', 'line-height: 1.6', 'color: #1e293b', 'font-size: 1rem'];

  const alignment = p.properties.alignment;
  if (alignment === 'center') pStyles.push('text-align: center');
  else if (alignment === 'right') pStyles.push('text-align: right');
  else if (alignment === 'both' || alignment === 'distribute') pStyles.push('text-align: justify');

  // Indentation
  const ind = p.properties.indentation;
  if (ind) {
    if (ind.left) pStyles.push(`padding-left: ${Math.round((ind.left as number) / 1440 * 96)}px`);
    if (ind.firstLine) pStyles.push(`text-indent: ${Math.round((ind.firstLine as number) / 1440 * 96)}px`);
  }

  // Shading
  const shd = p.properties.shading;
  if (shd?.fill && shd.fill !== 'auto' && shd.fill !== 'transparent') {
    pStyles.push(`background: #${shd.fill}`);
  }

  const shadingAttr = shd?.fill && shd.fill !== 'auto' && shd.fill !== 'transparent'
    ? ` style="${pStyles.join('; ')}; background: #${shd.fill}"`
    : ` style="${pStyles.join('; ')}"`;

  const contentHtml = inlinesHtml || '&nbsp;';
  return `<p${shadingAttr}>${markerHtml}${contentHtml}</p>`;
}

// ─── Table renderers ────────────────────────────────────────────────────────

function borderToCss(b: TableBorder | undefined): string {
  if (!b || b.style === 'none' || b.style === 'nil' || b.style === 'none') return 'none';
  const color = b.color ? `#${b.color}` : '#000000';
  const size = b.size ? Math.round(b.size / 8) : 1;
  const style = borderStyleToCss(b.style);
  return `${size}px ${style} ${color}`;
}

function borderStyleToCss(s: string): string {
  const map: Record<string, string> = {
    single: 'solid', dash: 'dashed', dot: 'dotted', double: 'double',
    triple: 'double', thick: 'solid', hair: 'solid', dashDot: 'dashed',
    dashDotDot: 'dashed', dotDash: 'dashed', dotDotDash: 'dashed',
    none: 'none', nil: 'none', none_thick: 'none', none_medium: 'none',
  };
  return map[s] || 'solid';
}

function shadingToCss(shd: Shading | undefined): string {
  if (!shd) return '';
  if (shd.fill && shd.fill !== 'auto' && shd.fill !== 'transparent') {
    return `#${shd.fill}`;
  }
  return '';
}

function renderCellBorders(b: TableCellBorders | undefined): string {
  if (!b) return '';
  const styles: string[] = [];
  if (b.top)    styles.push(`border-top: ${borderToCss(b.top)}`);
  if (b.bottom) styles.push(`border-bottom: ${borderToCss(b.bottom)}`);
  if (b.left)   styles.push(`border-left: ${borderToCss(b.left)}`);
  if (b.right)  styles.push(`border-right: ${borderToCss(b.right)}`);
  return styles.join('; ');
}

function renderTableCell(cell: TableCell, _isFirstRow: boolean): string {
  const { properties, children } = cell;
  const styles: string[] = [];

  // Borders
  const borderCss = renderCellBorders(properties?.borders);
  if (borderCss) styles.push(borderCss);

  // Padding
  styles.push('padding: 5px 8px');

  // Background
  const bg = shadingToCss(properties?.shading);
  if (bg) styles.push(`background: ${bg}`);

  // Width
  if (properties?.width) {
    styles.push(`width: ${properties.width}px`);
    styles.push('min-width: 20px');
  }

  // Vertical alignment
  if (properties?.verticalAlign === 'center') styles.push('vertical-align: middle');
  else if (properties?.verticalAlign === 'bottom') styles.push('vertical-align: bottom');
  else styles.push('vertical-align: top');

  const colspan = properties?.colspan && properties.colspan > 1 ? ` colspan="${properties.colspan}"` : '';
  const rowspan = properties?.rowspan && properties.rowspan > 1 ? ` rowspan="${properties.rowspan}"` : '';

  const contentHtml = children.map(c => {
    if (c.type === 'paragraph') return renderParagraph(c as Paragraph);
    if (c.type === 'table') return renderTable(c as Table);
    return '';
  }).join('');

  return `<td${colspan}${rowspan} style="${styles.join('; ')}">${contentHtml || '&nbsp;'}</td>`;
}

function renderTableRow(row: TableRow, isFirstRow: boolean): string {
  const { cells, properties } = row;
  const rowStyles: string[] = [];
  if (properties?.height) rowStyles.push(`height: ${Math.round((properties.height as number) / 1440 * 96)}px`);
  if (properties?.tableHeader) rowStyles.push('background: #f1f5f9');

  const cellsHtml = cells.map(c => renderTableCell(c, isFirstRow)).join('');
  const rowAttr = rowStyles.length > 0 ? ` style="${rowStyles.join('; ')}"` : '';
  return `<tr${rowAttr}>${cellsHtml}</tr>`;
}

function renderTable(tbl: Table): string {
  const { properties, rows } = tbl;
  const styles: string[] = [
    'border-collapse: collapse',
    'width: 100%',
    'font-size: 0.9rem',
    'margin: 16px 0',
  ];

  // Table-level borders
  const b = properties?.borders;
  if (b) {
    const topB = borderToCss(b.top);
    const bottomB = borderToCss(b.bottom);
    if (topB !== 'none') styles.push(`border-top: ${topB}`);
    if (bottomB !== 'none') styles.push(`border-bottom: ${bottomB}`);
  }

  // Table width
  if (properties?.width) {
    if (properties.width > 100) styles.push(`width: ${properties.width}px`);
    else styles.push(`width: ${properties.width}%`);
  }

  // Alignment
  if (properties?.alignment === 'center') styles.push('margin-left: auto; margin-right: auto');
  else if (properties?.alignment === 'right') styles.push('margin-left: auto');

  // Table background
  const bg = shadingToCss(properties?.shading);
  if (bg) styles.push(`background: ${bg}`);

  const rowsHtml = rows.map((row, i) => renderTableRow(row, i === 0)).join('');
  const hasHeader = rows[0]?.properties?.tableHeader;

  return `<table style="${styles.join('; ')}">${hasHeader ? `<thead>${renderTableRow(rows[0], true)}</thead><tbody>${rows.slice(1).map(r => renderTableRow(r, false)).join('')}</tbody>` : rowsHtml}</table>`;
}

// ─── Section renderer ────────────────────────────────────────────────────────

function renderSection(section: Section): string {
  const blocksHtml = section.children.map(block => {
    if (block.type === 'paragraph') return renderParagraph(block as Paragraph);
    if (block.type === 'table') return renderTable(block as Table);
    return '';
  }).join('');
  return blocksHtml;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function renderDocumentToHtml(doc: WordDocument): string {
  if (!doc.sections.length) {
    return `<div class="doc-error" style="padding: 24px; text-align: center; color: #ef4444;">文档解析失败或为空</div>`;
  }

  const sectionsHtml = doc.sections.map(renderSection).join('');

  return `<div class="docx-viewer" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; padding: 32px; background: white; min-height: 100%;">
  <div class="doc-content" style="max-width: 900px; margin: 0 auto;">
    ${sectionsHtml}
  </div>
</div>`;
}

export async function renderAsync(
  data: ArrayBuffer | Blob | File,
  container: HTMLElement
): Promise<void> {
  let buffer: ArrayBuffer;
  if (data instanceof Blob || data instanceof File) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = data;
  }

  const doc = await parseDocument(buffer);
  container.innerHTML = renderDocumentToHtml(doc);
}

export { parseDocument as parse };

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  if (typeof document === 'undefined') {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
