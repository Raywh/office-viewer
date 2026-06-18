export interface SandboxOptions {
  memoryLimit?: number;
  executionTimeout?: number;
}

export class WasmValidator {
  validateSource(source: string | URL): Promise<boolean> {
    return Promise.resolve(true);
  }

  validateIntegrity(data: ArrayBuffer, hash: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  createSandboxedInstance(
    module: WebAssembly.Module,
    options?: SandboxOptions
  ): Promise<WebAssembly.Instance> {
    return Promise.resolve({} as WebAssembly.Instance);
  }
}
