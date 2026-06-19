import { describe, it, expect } from 'vitest';
import { detectFormat } from '../src/format-detector';

describe('format-detector', () => {
  describe('detectFormat', () => {
    it('should return unknown for empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      expect(detectFormat(buffer)).toBe('unknown');
    });

    it('should detect by filename extension', () => {
      const buffer = new ArrayBuffer(4);
      expect(detectFormat(buffer, { filename: 'test.docx' })).toBe('docx');
      expect(detectFormat(buffer, { filename: 'test.doc' })).toBe('doc');
      expect(detectFormat(buffer, { filename: 'test.xlsx' })).toBe('xlsx');
      expect(detectFormat(buffer, { filename: 'test.xls' })).toBe('xls');
      expect(detectFormat(buffer, { filename: 'test.pptx' })).toBe('pptx');
      expect(detectFormat(buffer, { filename: 'test.ppt' })).toBe('ppt');
    });

    it('should detect by mime type', () => {
      const buffer = new ArrayBuffer(4);
      expect(detectFormat(buffer, { 
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })).toBe('docx');
      expect(detectFormat(buffer, { mimeType: 'application/msword' })).toBe('doc');
    });

    it('should detect zip magic number', () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 0x50;
      view[1] = 0x4b;
      
      expect(detectFormat(buffer)).not.toBe('unknown');
    });

    it('should detect CFB magic number', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      
      expect(detectFormat(buffer)).not.toBe('unknown');
    });
  });
});
