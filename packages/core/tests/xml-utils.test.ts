import { describe, it, expect } from 'vitest';
import {
  getFirstByLocalName,
  getAllByLocalName,
  getChildrenByLocalName,
  getLocalName,
  isLocalName,
  getTextContent,
} from '../src/xml-utils';

function makeDoc(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html') as unknown as Document;
}

function makeXmlDoc(xml: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'application/xml') as unknown as Document;
}

describe('xml-utils', () => {
  describe('getLocalName', () => {
    it('strips namespace prefix', () => {
      const doc = makeDoc('<html><body></body></html>');
      const el = doc.createElementNS('http://example.com', 'w:body');
      expect(getLocalName(el)).toBe('body');
    });

    it('returns lowercased name', () => {
      const doc = makeDoc('<html><body></body></html>');
      const el = doc.createElement('DIV');
      expect(getLocalName(el)).toBe('div');
    });

    it('handles null/undefined', () => {
      expect(getLocalName(null as any)).toBe('');
      expect(getLocalName(undefined as any)).toBe('');
    });
  });

  describe('isLocalName', () => {
    it('matches local name case-insensitively', () => {
      const doc = makeDoc('<html><body></body></html>');
      const el = doc.createElement('P');
      expect(isLocalName(el, 'p')).toBe(true);
      expect(isLocalName(el, 'P')).toBe(true);
      expect(isLocalName(el, 'paragraph')).toBe(false);
    });
  });

  describe('getFirstByLocalName', () => {
    it('finds element by local name in HTML', () => {
      const doc = makeDoc('<html><body><div id="target">hello</div></body></html>');
      const found = getFirstByLocalName(doc.body!, 'div');
      expect(found).not.toBeNull();
      expect(found?.textContent).toBe('hello');
    });

    it('finds namespaced element (w:p)', () => {
      const xml = `<root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body><w:p>Hello</w:p></w:body>
      </root>`;
      const doc = makeXmlDoc(xml);
      const p = getFirstByLocalName(doc.documentElement, 'p');
      expect(p).not.toBeNull();
      expect(p?.textContent).toBe('Hello');
    });

    it('finds element in nested structure', () => {
      const xml = `<root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>Text</w:t></w:r></w:p>
        </w:body>
      </root>`;
      const doc = makeXmlDoc(xml);
      const t = getFirstByLocalName(doc.documentElement, 't');
      expect(t).not.toBeNull();
      expect(t?.textContent).toBe('Text');
    });

    it('returns null when not found', () => {
      const doc = makeDoc('<html><body></body></html>');
      expect(getFirstByLocalName(doc.body!, 'nonexistent')).toBeNull();
    });

    it('accepts multiple name candidates', () => {
      const xml = `<root><para>one</para><p>two</p></root>`;
      const doc = makeXmlDoc(xml);
      const found = getFirstByLocalName(doc.documentElement, 'para', 'p');
      expect(found).not.toBeNull();
    });

    it('handles Document as root', () => {
      const doc = makeDoc('<html><head><title>Test</title></head><body></body></html>');
      const title = getFirstByLocalName(doc as any, 'title');
      expect(title?.textContent).toBe('Test');
    });
  });

  describe('getAllByLocalName', () => {
    it('finds all matching elements', () => {
      const xml = `<root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:p>Para 1</w:p><w:p>Para 2</w:p><w:p>Para 3</w:p>
      </root>`;
      const doc = makeXmlDoc(xml);
      const all = getAllByLocalName(doc.documentElement, 'p');
      expect(all).toHaveLength(3);
    });

    it('finds mixed namespaced elements', () => {
      const xml = `<root>
        <w:r>run1</w:r><w:r>run2</w:r><a:t>text</a:t>
      </root>`;
      const doc = makeXmlDoc(xml);
      const runs = getAllByLocalName(doc.documentElement, 'r');
      expect(runs).toHaveLength(2);
    });

    it('returns empty array for no matches', () => {
      const doc = makeDoc('<html><body></body></html>');
      expect(getAllByLocalName(doc.body!, 'nonexistent')).toHaveLength(0);
    });
  });

  describe('getChildrenByLocalName', () => {
    it('finds direct children only', () => {
      const xml = `<root><parent><child>inner</child></parent><child>sibling</child></root>`;
      const doc = makeXmlDoc(xml);
      const children = getChildrenByLocalName(doc.documentElement, 'child');
      expect(children).toHaveLength(1);
      expect(children[0].textContent).toBe('sibling');
    });

    it('finds multiple child types', () => {
      const xml = `<root><p>para</p><tbl>table</tbl><p>para2</p></root>`;
      const doc = makeXmlDoc(xml);
      const ps = getChildrenByLocalName(doc.documentElement, 'p', 'tbl');
      expect(ps).toHaveLength(3);
    });

    it('handles namespaced children', () => {
      const xml = `<root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body><w:p>P1</w:p><w:tbl>T1</w:tbl></w:body>
      </root>`;
      const doc = makeXmlDoc(xml);
      const body = getFirstByLocalName(doc.documentElement, 'body')!;
      const ps = getChildrenByLocalName(body, 'p');
      expect(ps).toHaveLength(1);
      expect(ps[0].textContent).toBe('P1');
    });
  });

  describe('getTextContent', () => {
    it('extracts plain text', () => {
      const doc = makeDoc('<html><body><p>Hello <b>World</b></p></body></html>');
      const p = doc.querySelector('p')!;
      expect(getTextContent(p)).toBe('Hello World');
    });

    it('converts <br> to newline', () => {
      const doc = makeDoc('<html><body><p>Line 1<br>Line 2</p></body></html>');
      const p = doc.querySelector('p')!;
      expect(getTextContent(p)).toBe('Line 1\nLine 2');
    });

    it('returns empty string for null', () => {
      expect(getTextContent(null as any)).toBe('');
    });

    it('extracts from namespaced elements', () => {
      const xml = `<root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:r><w:t>Hello</w:t></w:r>
      </root>`;
      const doc = makeXmlDoc(xml);
      const r = getFirstByLocalName(doc.documentElement, 'r')!;
      expect(getTextContent(r)).toBe('Hello');
    });

    it('handles deeply nested content', () => {
      const xml = `<root>
        <a><b><c><d>Deep</d></c></b></a>
      </root>`;
      const doc = makeXmlDoc(xml);
      const a = getFirstByLocalName(doc.documentElement, 'a')!;
      expect(getTextContent(a)).toBe('Deep');
    });
  });
});
