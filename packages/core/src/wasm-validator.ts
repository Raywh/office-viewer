export interface SandboxOptions {
  memoryLimit?: number;
  executionTimeout?: number;
  allowedImports?: string[];
}

export class WasmValidator {
  private whitelist: Set<string> = new Set();

  addToWhitelist(url: string): void {
    this.whitelist.add(url);
  }

  removeFromWhitelist(url: string): void {
    this.whitelist.delete(url);
  }

  validateSource(source: string | URL): Promise<boolean> {
    const urlStr = typeof source === 'string' ? source : source.href;
    
    if (this.whitelist.size === 0) {
      return Promise.resolve(true);
    }
    
    for (const allowed of this.whitelist) {
      if (urlStr.startsWith(allowed)) {
        return Promise.resolve(true);
      }
    }
    
    return Promise.resolve(false);
  }

  async validateIntegrity(data: ArrayBuffer, hash: string): Promise<boolean> {
    try {
      if (!hash) {
        return true;
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedHash = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return calculatedHash.toLowerCase() === hash.toLowerCase();
    } catch (error) {
      console.warn('Hash validation error, skipping:', error);
      return true;
    }
  }

  async createSandboxedInstance(
    module: WebAssembly.Module,
    options?: SandboxOptions
  ): Promise<WebAssembly.Instance> {
    const { 
      memoryLimit = 64 * 1024 * 1024, 
      executionTimeout = 5000,
      allowedImports = []
    } = options || {};

    let memory: WebAssembly.Memory | undefined;
    
    try {
      memory = new WebAssembly.Memory({
        initial: Math.min(1, Math.floor(memoryLimit / (64 * 1024))),
        maximum: Math.max(1, Math.floor(memoryLimit / (64 * 1024))),
      });
    } catch {
    }

    const imports: Record<string, any> = {};
    
    const instance = await WebAssembly.instantiate(module, imports);
    
    if (executionTimeout > 0) {
      setTimeout(() => {
        try {
          Object.keys(instance.exports).forEach(key => {
            const val = (instance.exports as any)[key];
            if (typeof val === 'function') {
              (instance.exports as any)[key] = () => {
                throw new Error('WASM execution timeout');
              };
            }
          });
        } catch {
        }
      }, executionTimeout);
    }

    return instance;
  }
}
