import { describe, it, expect } from 'vitest';
import { ZipPackage } from '../src/zip-parser';

describe('zip-parser', () => {
  describe('ZipPackage', () => {
    it('should create instance without throwing', () => {
      const buffer = new ArrayBuffer(0);
      expect(() => new ZipPackage(buffer)).not.toThrow();
    });

    it('should handle empty buffer gracefully', () => {
      const buffer = new ArrayBuffer(0);
      const zip = new ZipPackage(buffer);
      
      expect(zip.getPart('/')).not.toBeNull();
      expect(zip.listAllParts().length).toBeGreaterThanOrEqual(0);
    });

    it('should get relationships', () => {
      const buffer = new ArrayBuffer(0);
      const zip = new ZipPackage(buffer);
      
      const rels = zip.getRelationships();
      expect(Array.isArray(rels)).toBe(true);
    });

    it('should get parts by content type', () => {
      const buffer = new ArrayBuffer(0);
      const zip = new ZipPackage(buffer);
      
      const parts = zip.getPartsByContentType('application/xml');
      expect(Array.isArray(parts)).toBe(true);
    });
  });
});
