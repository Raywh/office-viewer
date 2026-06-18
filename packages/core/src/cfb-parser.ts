export class CfbPackage {
  private streams: Map<string, ArrayBuffer> = new Map();

  constructor(data: ArrayBuffer) {
    this.parse(data);
  }

  private parse(data: ArrayBuffer): void {
  }

  getStream(path: string): ArrayBuffer | null {
    return this.streams.get(path) || null;
  }

  listStreams(): string[] {
    return [];
  }
}
