import { describe, it, expect } from 'vitest';
import { WasmValidator } from '../src/wasm-validator';

describe('wasm-validator', () => {
  describe('WasmValidator', () => {
    it('should create instance without throwing', () => {
      expect(() => new WasmValidator()).not.toThrow();
    });

    it('should validate source without whitelist', async () => {
      const validator = new WasmValidator();
      
      const result = await validator.validateSource('https://example.com/test.wasm');
      expect(result).toBe(true);
    });

    it('should validate source with whitelist', async () => {
      const validator = new WasmValidator();
      validator.addToWhitelist('https://example.com');
      
      const result = await validator.validateSource('https://example.com/test.wasm');
      expect(result).toBe(true);
    });

    it('should add and remove from whitelist', async () => {
      const validator = new WasmValidator();
      validator.addToWhitelist('https://trusted.com');
      validator.removeFromWhitelist('https://trusted.com');
      
      const result = await validator.validateSource('https://trusted.com/test.wasm');
      expect(result).toBe(true);
    });

    it('should validate integrity without hash', async () => {
      const validator = new WasmValidator();
      const buffer = new ArrayBuffer(16);
      
      const result = await validator.validateIntegrity(buffer, '');
      expect(result).toBe(true);
    });

    it('should create sandboxed instance stub', async () => {
      const validator = new WasmValidator();
      
      const emptyModule = new WebAssembly.Module(new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 
        0x01, 0x00, 0x00, 0x00
      ]));
      
      const result = await validator.createSandboxedInstance(emptyModule);
      expect(result).toBeDefined();
    });
  });
});
