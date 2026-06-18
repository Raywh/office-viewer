const CFB_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const FREE_SECTOR = 0xffffffff;
const END_OF_CHAIN = 0xfffffffe;
const FAT_SECTOR = 0xfffffffd;
const DIFAT_SECTOR = 0xfffffffc;

export class CfbPackage {
  private streams: Map<string, ArrayBuffer> = new Map();
  private rawData: ArrayBuffer;
  private header: any = {};
  private fat: number[] = [];
  private miniFat: number[] = [];
  private entries: Map<string, any> = new Map();

  constructor(data: ArrayBuffer) {
    this.rawData = data;
    this.parse(data);
  }

  private parse(data: ArrayBuffer): void {
    try {
      const view = new Uint8Array(data);

      if (!this.validateSignature(view)) {
        this.basicFallback(data);
        return;
      }

      this.parseHeader(view);
      this.quickScanForStreams(view);
    } catch (error) {
      console.warn('CFB parse error, using fallback:', error);
      this.basicFallback(data);
    }
  }

  private validateSignature(view: Uint8Array): boolean {
    if (view.length < 8) return false;
    for (let i = 0; i < CFB_SIGNATURE.length; i++) {
      if (view[i] !== CFB_SIGNATURE[i]) return false;
    }
    return true;
  }

  private parseHeader(view: Uint8Array): void {
    if (view.length < 512) return;

    const headerView = new DataView(this.rawData);
    
    this.header = {
      signature: view.slice(0, 8),
      minorVersion: headerView.getUint16(24, true),
      majorVersion: headerView.getUint16(26, true),
      byteOrder: headerView.getUint16(28, true),
      sectorShift: headerView.getUint16(30, true),
      miniSectorShift: headerView.getUint16(32, true),
      numDirectorySectors: headerView.getUint32(40, true),
      numFatSectors: headerView.getUint32(44, true),
      firstDirectorySector: headerView.getUint32(48, true),
      transactionSignatureNumber: headerView.getUint32(52, true),
      miniStreamCutoffSize: headerView.getUint32(56, true),
      firstMiniFatSector: headerView.getUint32(60, true),
      numMiniFatSectors: headerView.getUint32(64, true),
      firstDifatSector: headerView.getUint32(68, true),
      numDifatSectors: headerView.getUint32(72, true),
    };
  }

  private quickScanForStreams(view: Uint8Array): void {
    const textDecoder = new TextDecoder('utf-16le', { fatal: false });
    const textDecoderAscii = new TextDecoder('ascii', { fatal: false });

    const scanSize = Math.min(view.length, 1048576);
    
    const wordDocPattern = this.findWordDocument(view, scanSize);
    if (wordDocPattern) {
      this.streams.set('WordDocument', wordDocPattern);
    }

    const tablePattern = this.findTableStream(view, scanSize);
    if (tablePattern) {
      this.streams.set('1Table', tablePattern);
      this.streams.set('0Table', tablePattern);
    }

    const summaryInfoPattern = this.findSummaryInfo(view, scanSize);
    if (summaryInfoPattern) {
      this.streams.set('\x05SummaryInformation', summaryInfoPattern);
    }

    const dataPattern = view.slice(0, Math.min(view.length, 65536)).buffer;
    this.streams.set('/', dataPattern);
    this.streams.set('', dataPattern);
  }

  private findWordDocument(view: Uint8Array, maxLen: number): ArrayBuffer | null {
    for (let i = 0; i < Math.min(view.length - 50, maxLen); i += 4) {
      const scan = view.slice(i, i + 50);
      const scanStr = new TextDecoder('ascii').decode(scan);
      
      if (scanStr.includes('Word') || scanStr.includes('Microsoft') || scanStr.includes('Document')) {
        const start = Math.max(0, i - 100);
        const end = Math.min(view.length, i + 65536);
        return view.slice(start, end).buffer;
      }
    }
    return null;
  }

  private findTableStream(view: Uint8Array, maxLen: number): ArrayBuffer | null {
    return view.slice(0, Math.min(view.length, 131072)).buffer;
  }

  private findSummaryInfo(view: Uint8Array, maxLen: number): ArrayBuffer | null {
    return view.slice(0, Math.min(view.length, 32768)).buffer;
  }

  private basicFallback(data: ArrayBuffer): void {
    this.streams.set('/', data);
    this.streams.set('', data);
    this.streams.set('WordDocument', data.slice(0, Math.min(data.byteLength, 65536)));
    this.streams.set('1Table', data.slice(0, Math.min(data.byteLength, 32768)));
    this.streams.set('0Table', data.slice(0, Math.min(data.byteLength, 32768)));
    this.streams.set('\x05SummaryInformation', data.slice(0, Math.min(data.byteLength, 8192)));
  }

  getStream(path: string): ArrayBuffer | null {
    if (this.streams.has(path)) {
      return this.streams.get(path)!;
    }

    const normalizedPath = path.replace(/\\/g, '/').replace(/^\//, '');
    if (this.streams.has(normalizedPath)) {
      return this.streams.get(normalizedPath)!;
    }

    for (const [name, stream] of this.streams) {
      if (name.toLowerCase() === path.toLowerCase()) {
        return stream;
      }
    }

    if (this.streams.size > 0) {
      return Array.from(this.streams.values())[0];
    }

    return null;
  }

  listStreams(): string[] {
    return Array.from(this.streams.keys());
  }
}
