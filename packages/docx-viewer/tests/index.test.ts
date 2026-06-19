import { describe, it, expect } from 'vitest';
import {
  renderDocumentToHtml,
  DocumentParser,
  WordDocument,
  Paragraph,
  Table,
} from '../src/index';

// Build a minimal DOCX-like ZIP in-memory for testing
function buildMinimalDocx(): ArrayBuffer {
  const encoder = new TextEncoder();

  const parts: Array<{ name: string; data: Uint8Array; compressed?: boolean }> = [
    {
      name: '[Content_Types].xml',
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`),
    },
    {
      name: '_rels/.rels',
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`),
    },
    {
      name: 'word/document.xml',
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>Document Title</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:i/><w:sz w:val="24"/></w:rPr><w:t>Bold and italic text</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Plain paragraph with </w:t></w:r>
      <w:r><w:rPr><w:color w:val="FF0000"/><w:sz w:val="18"/></w:rPr><w:t>red colored</w:t></w:r>
      <w:r><w:t> words.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:r><w:t>Indented paragraph</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r><w:t>Centered text</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:color="000000"/>
          <w:left w:val="single" w:sz="4" w:color="000000"/>
          <w:bottom w:val="single" w:sz="4" w:color="000000"/>
          <w:right w:val="single" w:sz="4" w:color="000000"/>
          <w:insideH w:val="single" w:sz="4" w:color="AAAAAA"/>
          <w:insideV w:val="single" w:sz="4" w:color="AAAAAA"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Header A</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Header B</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Cell 1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cell 2</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Cell 3</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cell 4</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:p>
      <w:r><w:t>After table</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`),
    },
    {
      name: 'word/_rels/document.xml.rels',
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    },
  ];

  const chunks: number[] = [];

  for (const part of parts) {
    const nameBytes = new TextEncoder().encode(part.name);
    const data = part.data;
    const size = data.byteLength;

    chunks.push(0x50, 0x4b, 0x03, 0x04); // signature
    chunks.push(0x14, 0x00);              // version
    chunks.push(0x00, 0x00);              // flags
    chunks.push(0x00, 0x00);              // compression: stored
    chunks.push(0x00, 0x00);              // mod time
    chunks.push(0x21, 0x00);              // mod date
    chunks.push(0x00, 0x00, 0x00, 0x00); // crc
    chunks.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
    chunks.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
    chunks.push(nameBytes.byteLength & 0xff, (nameBytes.byteLength >> 8) & 0xff);
    chunks.push(0x00, 0x00);
    for (let i = 0; i < nameBytes.byteLength; i++) chunks.push(nameBytes[i]);
    for (let i = 0; i < data.byteLength; i++) chunks.push(data[i]);
  }

  chunks.push(0x50, 0x4b, 0x05, 0x06);
  chunks.push(0x00, 0x00, 0x00, 0x00);
  chunks.push(0x00, 0x00, 0x00, 0x00);
  chunks.push(0x00, 0x00, 0x00, 0x00);
  chunks.push(0x00, 0x00, 0x00, 0x00);
  chunks.push(0x00, 0x00);

  return new Uint8Array(chunks).buffer;
}

// Build a DOCX with numbering.xml for list testing
function buildDocxWithLists(): ArrayBuffer {
  const encoder = new TextEncoder();
  const docXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>
      <w:r><w:t>First bullet item</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>
      <w:r><w:t>Second bullet item</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr>
      <w:r><w:t>Numbered item one</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr>
      <w:r><w:t>Numbered item two</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  const numberingXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:numFmt w:val="bullet"/>
      <w:lvlJc w:left="720"/>
      <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:numFmt w:val="decimal"/>
      <w:lvlJc w:left="720"/>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1">
    <w:abstractNumId w:val="0"/>
  </w:num>
  <w:num w:numId="2">
    <w:abstractNumId w:val="1"/>
  </w:num>
</w:numbering>`;

  const parts = [
    { name: '[Content_Types].xml', data: encoder.encode('<Types/>') },
    { name: '_rels/.rels', data: encoder.encode('<Relationships><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
    { name: 'word/document.xml', data: encoder.encode(docXml) },
    { name: 'word/numbering.xml', data: encoder.encode(numberingXml) },
    { name: 'word/_rels/document.xml.rels', data: encoder.encode('<Relationships/>') },
  ];

  const chunks: number[] = [];
  for (const part of parts) {
    const nameBytes = encoder.encode(part.name);
    const data = part.data;
    const size = data.byteLength;
    chunks.push(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21, 0x00, 0x00, 0x00, 0x00, 0x00);
    chunks.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
    chunks.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
    chunks.push(nameBytes.byteLength & 0xff, (nameBytes.byteLength >> 8) & 0xff, 0x00, 0x00);
    for (let i = 0; i < nameBytes.byteLength; i++) chunks.push(nameBytes[i]);
    for (let i = 0; i < data.byteLength; i++) chunks.push(data[i]);
  }
  chunks.push(0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
  return new Uint8Array(chunks).buffer;
}

describe('docx-viewer', () => {
  describe('DocumentParser', () => {
    it('parses a minimal docx document', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      expect(doc).not.toBeNull();
      expect(doc.sections.length).toBeGreaterThanOrEqual(1);
      expect(doc.sections[0].children.length).toBeGreaterThan(0);
    });

    it('extracts paragraphs with text', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const paragraphs = doc.sections[0].children.filter(
        (b): b is Paragraph => b.type === 'paragraph'
      );
      expect(paragraphs.length).toBeGreaterThanOrEqual(5);
    });

    it('extracts run properties (bold, italic, size, color)', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const paragraphs = doc.sections[0].children.filter(
        (b): b is Paragraph => b.type === 'paragraph'
      );

      // Second paragraph has bold + italic
      const boldPara = paragraphs[1];
      const runs = boldPara.children.filter((i: any): i is any => i.type === 'run');
      expect(runs.length).toBeGreaterThanOrEqual(1);
      expect(runs[0].properties.bold).toBe(true);
      expect(runs[0].properties.italic).toBe(true);
    });

    it('extracts color run property', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const paragraphs = doc.sections[0].children.filter(
        (b): b is Paragraph => b.type === 'paragraph'
      );

      // Third paragraph has red colored text
      const coloredPara = paragraphs[2];
      const runs = coloredPara.children.filter((i: any): i is any => i.type === 'run');
      const coloredRun = runs.find((r: any) => r.properties.color === 'FF0000');
      expect(coloredRun).toBeDefined();
    });

    it('extracts paragraph alignment', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const paragraphs = doc.sections[0].children.filter(
        (b): b is Paragraph => b.type === 'paragraph'
      );
      const centered = paragraphs.find((p: Paragraph) => p.properties.alignment === 'center');
      expect(centered).toBeDefined();
    });

    it('extracts paragraph indentation', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const paragraphs = doc.sections[0].children.filter(
        (b): b is Paragraph => b.type === 'paragraph'
      );
      const indented = paragraphs.find((p: Paragraph) => p.properties.indentation?.left);
      expect(indented).toBeDefined();
    });

    it('extracts tables', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const tables = doc.sections[0].children.filter(
        (b): b is Table => b.type === 'table'
      );
      expect(tables.length).toBe(1);
    });

    it('extracts table rows and cells', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const tables = doc.sections[0].children.filter(
        (b): b is Table => b.type === 'table'
      );
      const table = tables[0];
      expect(table.rows.length).toBe(3); // header + 2 data rows
      expect(table.rows[0].cells.length).toBe(2);
    });

    it('extracts table border properties', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const tables = doc.sections[0].children.filter(
        (b): b is Table => b.type === 'table'
      );
      const table = tables[0];
      expect(table.properties.borders).toBeDefined();
      expect(table.properties.borders?.top?.style).toBe('single');
      expect(table.properties.borders?.top?.color).toBe('000000');
    });

    it('extracts table cell borders', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const tables = doc.sections[0].children.filter(
        (b): b is Table => b.type === 'table'
      );
      const cell = tables[0].rows[0].cells[0];
      expect(cell.properties?.borders).toBeDefined();
    });

    it('extracts hyperlinks', async () => {
      // Build a doc with a hyperlink
      const encoder = new TextEncoder();
      const docXml = `<?xml version="1.0"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:hyperlink r:id="rId1">
        <w:r><w:t>Click here</w:t></w:r>
      </w:hyperlink>
    </w:p>
  </w:body>
</w:document>`;
      const relsXml = `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://example.com" TargetMode="External"/>
</Relationships>`;

      const parts = [
        { name: '[Content_Types].xml', data: encoder.encode('<Types/>') },
        { name: '_rels/.rels', data: encoder.encode('<Relationships><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
        { name: 'word/document.xml', data: encoder.encode(docXml) },
        { name: 'word/_rels/document.xml.rels', data: encoder.encode(relsXml) },
      ];

      const chunks: number[] = [];
      for (const part of parts) {
        const nb = encoder.encode(part.name);
        const size = part.data.byteLength;
        chunks.push(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21, 0x00, 0x00, 0x00, 0x00, 0x00);
        chunks.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
        chunks.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
        chunks.push(nb.byteLength & 0xff, (nb.byteLength >> 8) & 0xff, 0x00, 0x00);
        for (let i = 0; i < nb.byteLength; i++) chunks.push(nb[i]);
        for (let i = 0; i < part.data.byteLength; i++) chunks.push(part.data[i]);
      }
      chunks.push(0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
      const buffer = new Uint8Array(chunks).buffer;

      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();
      const paragraphs = doc.sections[0].children.filter((b): b is Paragraph => b.type === 'paragraph');
      const hyperlink = (paragraphs[0].children[0] as any);
      expect(hyperlink?.type).toBe('hyperlink');
      expect(hyperlink?.target).toBe('http://example.com');
    });

    it('loads numbering definitions from word/numbering.xml', async () => {
      const buffer = buildDocxWithLists();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();

      const paragraphs = doc.sections[0].children.filter(
        (b): b is Paragraph => b.type === 'paragraph'
      );
      const listParagraphs = paragraphs.filter((p: Paragraph) => !!p.properties.numbering);
      expect(listParagraphs.length).toBe(4);

      const bulletParas = listParagraphs.filter((p: Paragraph) => p.properties.numbering?.numFmt === 'bullet');
      expect(bulletParas.length).toBe(2);

      const numberedParas = listParagraphs.filter((p: Paragraph) => p.properties.numbering?.numFmt === 'decimal');
      expect(numberedParas.length).toBe(2);
    });
  });

  describe('renderDocumentToHtml', () => {
    it('renders an empty document gracefully', () => {
      const emptyDoc: WordDocument = { sections: [], relationships: new Map() };
      const html = renderDocumentToHtml(emptyDoc);
      expect(html).toContain('doc-error');
    });

    it('renders a parsed document to HTML', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();
      const html = renderDocumentToHtml(doc);

      expect(html).toContain('docx-viewer');
      expect(html).toContain('Document Title');
      expect(html).toContain('Bold and italic text');
      expect(html).toContain('Header A');
      expect(html).toContain('Cell 1');
      expect(html).toContain('After table');
    });

    it('renders bold and italic run styles', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();
      const html = renderDocumentToHtml(doc);

      expect(html).toContain('font-weight: 700');
      expect(html).toContain('font-style: italic');
    });

    it('renders table borders as CSS', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();
      const html = renderDocumentToHtml(doc);

      expect(html).toContain('border');
      expect(html).toContain('solid');
    });

    it('renders centered text', async () => {
      const buffer = buildMinimalDocx();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();
      const html = renderDocumentToHtml(doc);

      expect(html).toContain('text-align: center');
    });

    it('renders list paragraphs with bullet markers', async () => {
      const buffer = buildDocxWithLists();
      const parser = await DocumentParser.create(buffer);
      const doc = await parser.parse();
      const html = renderDocumentToHtml(doc);

      expect(html).toContain('list-marker');
      expect(html).toContain('First bullet item');
    });
  });
});
