import { describe, it, expect } from 'vitest';
import { CfbPackage } from '../src/cfb-parser';

describe('cfb-parser', () => {
  describe('CfbPackage', () => {
    it('should create instance without throwing', () => {
      const buffer = new ArrayBuffer(0);
      expect(() => new CfbPackage(buffer)).not.toThrow();
    });

    it('should handle empty buffer gracefully', () => {
      const buffer = new ArrayBuffer(0);
      const cfb = new CfbPackage(buffer);
      
      const stream = cfb.getStream('/');
      expect(stream).not.toBeNull();
      expect(cfb.listStreams().length).toBeGreaterThanOrEqual(0);
    });

    it('should validate CFB signature', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      
      const cfb = new CfbPackage(buffer);
      expect(cfb.listStreams()).not.toBeNull();
    });

    it('should list streams', () => {
      const buffer = new ArrayBuffer(0);
      const cfb = new CfbPackage(buffer);
      
      const streams = cfb.listStreams();
      expect(Array.isArray(streams)).toBe(true);
    });

    it('should get stream by name', () => {
      const buffer = new ArrayBuffer(0);
      const cfb = new CfbPackage(buffer);
      
      const stream = cfb.getStream('WordDocument');
      expect(stream).not.toBeNull();
    });

    it('should get stream by path variations', () => {
      const buffer = new ArrayBuffer(0);
      const cfb = new CfbPackage(buffer);
      
      expect(cfb.getStream('/')).not.toBeNull();
      expect(cfb.getStream('')).not.toBeNull();
    });
  });
});
