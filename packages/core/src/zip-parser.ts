export interface ZipPart {
  path: string;
  contentType?: string;
  data: ArrayBuffer;
  getText(): string;
  getXml(): Document;
}

export interface PackageRelationship {
  id: string;
  type: string;
  target: string;
}

export interface ContentTypeOverride {
  extension: string;
  contentType: string;
}

export interface ContentTypeDefault {
  partName: string;
  contentType: string;
}

export class ZipPackage {
  private parts: Map<string, ZipPart> = new Map();
  private contentTypes: Map<string, string> = new Map();
  private relationships: Map<string, PackageRelationship[]> = new Map();
  private globalRelationships: PackageRelationship[] = [];
  private allPartNames: string[] = [];

  // 工厂方法来创建异步的 ZipPackage 实例
  static async create(data: ArrayBuffer): Promise<ZipPackage> {
    const pkg = new ZipPackage();
    await pkg.parse(data);
    return pkg;
  }

  private constructor() {}

  private async parse(data: ArrayBuffer): Promise<void> {
    try {
      const { parts, relationships, contentTypes } = await this.basicZipParse(data);

      this.parts = parts;
      this.contentTypes = contentTypes;
      this.relationships = relationships;

      if (contentTypes.size === 0) {
        this.tryDetectContentTypes();
      }
    } catch (error) {
      console.warn('Zip parsing failed, using fallback:', error);
      this.basicFallback(data);
    }
  }

  private async basicZipParse(data: ArrayBuffer): Promise<{
    parts: Map<string, ZipPart>;
    contentTypes: Map<string, string>;
    relationships: Map<string, PackageRelationship[]>;
  }> {
    const parts = new Map<string, ZipPart>();
    const contentTypes = new Map<string, string>();
    const relationships = new Map<string, PackageRelationship[]>();
    const partNames: string[] = [];

    const view = new Uint8Array(data);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });

    let offset = 0;
    const scanned: { [key: string]: { offset: number; name: string; compressedSize: number; uncompressedSize: number; compressionMethod: number } } = {};

    while (offset < view.length - 30) {
      if (view[offset] === 0x50 && view[offset + 1] === 0x4b) {
        if (view[offset + 2] === 0x03 && view[offset + 3] === 0x04) {
          const result = this.readLocalFileHeader(view, offset);
          if (result) {
            scanned[result.name] = result;
            partNames.push(result.name);
            offset = result.nextOffset;
            continue;
          }
        } else if (view[offset + 2] === 0x01 && view[offset + 3] === 0x02) {
          offset += 46;
          const fileNameLength = view[offset] | (view[offset + 1] << 8);
          const extraFieldLength = view[offset + 2] | (view[offset + 3] << 8);
          const fileCommentLength = view[offset + 4] | (view[offset + 5] << 8);
          offset += 6 + fileNameLength + extraFieldLength + fileCommentLength;
          continue;
        } else if (view[offset + 2] === 0x05 && view[offset + 3] === 0x06) {
          break;
        }
      }
      offset++;
    }

    for (const entry of Object.values(scanned)) {
      // 调试日志
      if (entry.name.includes('document.xml') || entry.name.includes('slide')) {
        console.log('[ZipPackage] Found entry:', entry.name);
      }

      const partData = await this.extractPartData(view, entry);
      
      if (entry.name.includes('document.xml')) {
        console.log('[ZipPackage] document.xml data length:', partData?.byteLength);
      }

      if (partData) {
        const zipPart: ZipPart = {
          path: entry.name,
          data: partData,
          getText(): string {
            return textDecoder.decode(this.data);
          },
          getXml(): Document {
            const parser = new DOMParser();
            const text = this.getText();
            const xml = parser.parseFromString(text, 'application/xml');
            
            // 检查是否有解析错误
            const errorNode = xml.querySelector('parsererror');
            if (errorNode) {
              console.warn('[ZipPackage] XML parse error for', entry.name);
            }
            return xml;
          },
        };
        parts.set(entry.name, zipPart);

        if (entry.name === '[Content_Types].xml') {
          this.parseContentTypes(zipPart, contentTypes);
        }
      }
    }
    
    this.allPartNames = partNames;

    for (const [name, part] of parts.entries()) {
      if (name.endsWith('.rels')) {
        const rels = this.parseRelationships(part);
        if (name === '_rels/.rels') {
          relationships.set('', rels);
        } else {
          const targetName = name.replace('_rels/', '').replace('.rels', '');
          relationships.set(targetName, rels);
        }
      }
    }

    return { parts, contentTypes, relationships };
  }

  private readLocalFileHeader(view: Uint8Array, offset: number) {
    if (offset + 30 > view.length) return null;

    const compressionMethod = view[offset + 8] | (view[offset + 9] << 8);
    const compressedSize = view[offset + 18] | (view[offset + 19] << 8) | (view[offset + 20] << 16) | (view[offset + 21] << 24);
    const uncompressedSize = view[offset + 22] | (view[offset + 23] << 8) | (view[offset + 24] << 16) | (view[offset + 25] << 8);
    const fileNameLength = view[offset + 26] | (view[offset + 27] << 8);
    const extraFieldLength = view[offset + 28] | (view[offset + 29] << 8);

    if (offset + 30 + fileNameLength + extraFieldLength > view.length) return null;

    const nameBytes = view.slice(offset + 30, offset + 30 + fileNameLength);
    const name = new TextDecoder('utf-8', { fatal: false }).decode(nameBytes);

    return {
      offset: offset + 30 + fileNameLength + extraFieldLength,
      nextOffset: offset + 30 + fileNameLength + extraFieldLength + compressedSize,
      name,
      compressedSize,
      uncompressedSize,
      compressionMethod,
    };
  }

  private async extractPartData(view: Uint8Array, entry: any): Promise<ArrayBuffer | null> {
    console.log('[ZipPackage] extractPartData for', entry.name, 'compressionMethod:', entry.compressionMethod);
    if (entry.compressionMethod === 0) {
      // 未压缩，直接返回
      return view.slice(entry.offset, entry.offset + entry.compressedSize).buffer;
    } else if (entry.compressionMethod === 8) {
      // DEFLATE 压缩，使用浏览器原生解压
      console.log('[ZipPackage] Decompressing DEFLATE data for', entry.name);
      const compressedData = view.slice(entry.offset, entry.offset + entry.compressedSize);
      try {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(compressedData);
        writer.close();
        
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let result;
        do {
          result = await reader.read();
          if (result.value) {
            chunks.push(result.value);
          }
        } while (!result.done);
        
        // 合并所有 chunk
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        const decompressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        console.log('[ZipPackage] Decompressed', compressedData.length, '→', decompressed.length, 'bytes for', entry.name);
        return decompressed.buffer;
      } catch (error) {
        console.error('[ZipPackage] Decompression failed:', error);
        return new ArrayBuffer(0);
      }
    }
    console.warn('[ZipPackage] Unsupported compression method:', entry.compressionMethod);
    return new ArrayBuffer(0);
  }

  private parseContentTypes(part: ZipPart, map: Map<string, string>): void {
    try {
      const text = part.getText();
      const overrideMatch = text.match(/<Override[^>]*PartName="([^"]+)"[^>]*ContentType="([^"]+)"/g);
      const defaultMatch = text.match(/<Default[^>]*Extension="([^"]+)"[^>]*ContentType="([^"]+)"/g);

      if (overrideMatch) {
        for (const match of overrideMatch) {
          const nameMatch = match.match(/PartName="([^"]+)"/);
          const typeMatch = match.match(/ContentType="([^"]+)"/);
          if (nameMatch && typeMatch) {
            map.set(nameMatch[1], typeMatch[1]);
          }
        }
      }

      if (defaultMatch) {
        for (const match of defaultMatch) {
          const extMatch = match.match(/Extension="([^"]+)"/);
          const typeMatch = match.match(/ContentType="([^"]+)"/);
          if (extMatch && typeMatch) {
            map.set(`.${extMatch[1]}`, typeMatch[1]);
          }
        }
      }
    } catch {
    }
  }

  private parseRelationships(part: ZipPart): PackageRelationship[] {
    const relationships: PackageRelationship[] = [];
    try {
      const text = part.getText();
      const relMatches = text.match(/<Relationship[^>]*Id="([^"]+)"[^>]*Type="([^"]+)"[^>]*Target="([^"]+)"/g);
      
      if (relMatches) {
        for (const match of relMatches) {
          const id = match.match(/Id="([^"]+)"/)?.[1];
          const type = match.match(/Type="([^"]+)"/)?.[1];
          const target = match.match(/Target="([^"]+)"/)?.[1];
          
          if (id && type && target) {
            relationships.push({ id, type, target });
          }
        }
      }
    } catch {
    }
    return relationships;
  }

  private tryDetectContentTypes(): void {
    for (const [name] of this.parts) {
      const lowerName = name.toLowerCase();
      if (lowerName.endsWith('.xml')) {
        this.contentTypes.set(name, 'application/xml');
      } else if (lowerName.endsWith('.rels')) {
        this.contentTypes.set(name, 'application/vnd.openxmlformats-package.relationships+xml');
      }
    }
  }

  private basicFallback(data: ArrayBuffer): void {
    const textDecoder = new TextDecoder('utf-8', { fatal: false });

    const dummyPart: ZipPart = {
      path: '/',
      data: data,
      getText() {
        return textDecoder.decode(this.data.slice(0, Math.min(1024, data.byteLength)));
      },
      getXml() {
        return new Document();
      },
    };

    this.parts.set('/', dummyPart);
  }

  getPart(path: string): ZipPart | null {
    // 调试信息：列出所有可用的部分
    console.log('[ZipPackage] Looking for part:', path);
    console.log('[ZipPackage] Available parts:', Array.from(this.parts.keys()));

    // 尝试精确匹配
    if (this.parts.has(path)) {
      console.log('[ZipPackage] Exact match found:', path);
      return this.parts.get(path)!;
    }

    // 尝试不带前导斜杠
    const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path;
    if (this.parts.has(pathWithoutSlash)) {
      console.log('[ZipPackage] Found without leading slash:', pathWithoutSlash);
      return this.parts.get(pathWithoutSlash)!;
    }

    // 尝试带前导斜杠
    const pathWithSlash = !path.startsWith('/') ? '/' + path : path;
    if (this.parts.has(pathWithSlash)) {
      console.log('[ZipPackage] Found with leading slash:', pathWithSlash);
      return this.parts.get(pathWithSlash)!;
    }

    console.log('[ZipPackage] Part not found:', path);
    return null;
  }

  getPartsByContentType(contentType: string): ZipPart[] {
    const result: ZipPart[] = [];
    for (const [name, part] of this.parts) {
      const partType = this.contentTypes.get(name) || this.contentTypes.get(this.getExtension(name));
      if (partType === contentType || part.contentType === contentType) {
        result.push(part);
      }
    }
    return result;
  }

  getRelationships(partPath?: string): PackageRelationship[] {
    if (!partPath || partPath === '') {
      return this.relationships.get('') || [];
    }

    const relPath = partPath.replace(/\/([^/]+)$/, '/_rels/$1.rels');
    if (this.relationships.has(relPath)) {
      return this.relationships.get(relPath)!;
    }

    return [];
  }

  private getExtension(path: string): string {
    const lastDot = path.lastIndexOf('.');
    if (lastDot > -1) {
      return path.slice(lastDot).toLowerCase();
    }
    return '';
  }

  listAllParts(): string[] {
    return Array.from(this.parts.keys());
  }
}
