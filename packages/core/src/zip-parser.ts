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
  private allPartNames: string[] = [];

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
      // ZIP local file header signature: 0x04034b50
      if (view[offset] === 0x50 && view[offset + 1] === 0x4b &&
          view[offset + 2] === 0x03 && view[offset + 3] === 0x04) {
        const result = this.readLocalFileHeader(view, offset);
        if (result) {
          if (!(result.name in scanned)) {
            scanned[result.name] = result;
            partNames.push(result.name);
          }
          offset = result.nextOffset;
          continue;
        }
      } else if (view[offset] === 0x50 && view[offset + 1] === 0x4b &&
                 view[offset + 2] === 0x01 && view[offset + 3] === 0x02) {
        // Central directory file header: skip ~46 bytes + variable fields
        if (offset + 46 <= view.length) {
          const dv = new DataView(view.buffer, view.byteOffset + offset);
          const fileNameLength = dv.getUint16(28, true);
          const extraFieldLength = dv.getUint16(30, true);
          const fileCommentLength = dv.getUint16(32, true);
          offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
          continue;
        }
      } else if (view[offset] === 0x50 && view[offset + 1] === 0x4b &&
                 (view[offset + 2] === 0x05 || view[offset + 2] === 0x06)) {
        // End of central directory / data descriptor
        break;
      }
      offset++;
    }

    for (const entry of Object.values(scanned)) {
      const partData = await this.extractPartData(view, entry);

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
            return parser.parseFromString(text, 'application/xml');
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
          const targetName = name.replace(/_rels\//, '').replace(/\.rels$/, '');
          relationships.set(targetName, rels);
        }
      }
    }

    return { parts, contentTypes, relationships };
  }

  private readLocalFileHeader(view: Uint8Array, offset: number) {
    if (offset + 30 > view.length) return null;

    const dv = new DataView(view.buffer, view.byteOffset + offset);
    // signature = dv.getUint32(0, true); // 0x04034b50
    // version = dv.getUint16(4, true);
    // flags = dv.getUint16(6, true);
    const compressionMethod = dv.getUint16(8, true);
    // modTime = dv.getUint16(10, true);
    // modDate = dv.getUint16(12, true);
    // crc32 = dv.getUint32(14, true);
    const compressedSize = dv.getUint32(18, true);
    const uncompressedSize = dv.getUint32(22, true);
    const fileNameLength = dv.getUint16(26, true);
    const extraFieldLength = dv.getUint16(28, true);

    if (offset + 30 + fileNameLength + extraFieldLength + compressedSize > view.length + 1 &&
        compressedSize !== 0) {
      // If data descriptor is used (bit 3), sizes in local header are zero.
      // In that case, we need to search for the next signature.
      // For simplicity, try with compressedSize = 0 and fall through.
    }

    const nameBytes = view.slice(offset + 30, offset + 30 + fileNameLength);
    const name = new TextDecoder('utf-8', { fatal: false }).decode(nameBytes);

    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;

    // Handle data descriptor (ZIP flag bit 3): sizes follow the compressed data.
    // The signature 0x08074b50 is optional. This is a best-effort detection.
    let realCompressedSize = compressedSize;
    if (compressedSize === 0 && uncompressedSize === 0) {
      // Search for next local file header signature or EOCD
      let searchOffset = dataOffset;
      let found = false;
      const searchLimit = Math.min(view.length - 4, dataOffset + 1024 * 1024 * 10);
      while (searchOffset < searchLimit) {
        if (view[searchOffset] === 0x50 && view[searchOffset + 1] === 0x4b &&
            (view[searchOffset + 2] === 0x01 || view[searchOffset + 2] === 0x03 ||
             view[searchOffset + 2] === 0x05 || view[searchOffset + 2] === 0x06 ||
             view[searchOffset + 2] === 0x07 || view[searchOffset + 2] === 0x08)) {
          // Check if this is actually a signature
          const sig = view[searchOffset + 2];
          if (sig === 0x03 || sig === 0x01 || sig === 0x05 || sig === 0x06) {
            // Found next header. Calculate based on whether there's a data descriptor sig.
            // Check if before this we have 0x08074b50
            if (searchOffset >= 16 &&
                view[searchOffset - 16] === 0x50 && view[searchOffset - 15] === 0x4b &&
                view[searchOffset - 14] === 0x07 && view[searchOffset - 13] === 0x08) {
              // Data descriptor with signature: 4 (sig) + 4 (crc) + 4 (compressed) + 4 (uncompressed) = 16
              realCompressedSize = searchOffset - dataOffset - 16;
            } else if (searchOffset >= 12) {
              // Data descriptor without signature: 4 (crc) + 4 (compressed) + 4 (uncompressed) = 12
              realCompressedSize = searchOffset - dataOffset - 12;
            } else {
              realCompressedSize = searchOffset - dataOffset;
            }
            found = true;
            break;
          }
        }
        searchOffset++;
      }
      if (!found) {
        // Could not determine; use remaining bytes
        realCompressedSize = view.length - dataOffset;
      }
    }

    return {
      offset: dataOffset,
      nextOffset: dataOffset + realCompressedSize,
      name,
      compressedSize: realCompressedSize,
      uncompressedSize,
      compressionMethod,
    };
  }

  private async extractPartData(view: Uint8Array, entry: any): Promise<ArrayBuffer | null> {
    if (entry.compressionMethod === 0) {
      // Stored (no compression)
      const slice = view.slice(entry.offset, entry.offset + entry.compressedSize);
      return slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
    } else if (entry.compressionMethod === 8) {
      // DEFLATE
      const compressedData = view.slice(entry.offset, entry.offset + entry.compressedSize);
      try {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(compressedData);
        writer.close();

        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let totalLength = 0;
        let result;
        do {
          result = await reader.read();
          if (result.value) {
            chunks.push(result.value);
            totalLength += result.value.length;
          }
        } while (!result.done);

        const decompressed = new Uint8Array(totalLength);
        let pos = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, pos);
          pos += chunk.length;
        }
        return decompressed.buffer;
      } catch (error) {
        // Fallback: try with 'deflate' (without -raw)
        try {
          const ds = new DecompressionStream('deflate');
          const writer = ds.writable.getWriter();
          writer.write(compressedData);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks: Uint8Array[] = [];
          let totalLength = 0;
          let result;
          do {
            result = await reader.read();
            if (result.value) {
              chunks.push(result.value);
              totalLength += result.value.length;
            }
          } while (!result.done);
          const decompressed = new Uint8Array(totalLength);
          let pos = 0;
          for (const chunk of chunks) {
            decompressed.set(chunk, pos);
            pos += chunk.length;
          }
          return decompressed.buffer;
        } catch (e2) {
          console.error('[ZipPackage] DEFLATE decompression failed for', entry.name, e2);
          return new ArrayBuffer(0);
        }
      }
    }
    console.warn('[ZipPackage] Unsupported compression method for', entry.name, ':', entry.compressionMethod);
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
    // Exact match
    if (this.parts.has(path)) {
      return this.parts.get(path)!;
    }

    // Strip leading slash
    const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path;
    if (this.parts.has(pathWithoutSlash)) {
      return this.parts.get(pathWithoutSlash)!;
    }

    // Add leading slash
    const pathWithSlash = !path.startsWith('/') ? '/' + path : path;
    if (this.parts.has(pathWithSlash)) {
      return this.parts.get(pathWithSlash)!;
    }

    // Case-insensitive match (some libraries produce uppercase paths)
    const lowerPath = path.toLowerCase();
    for (const [key, part] of this.parts.entries()) {
      if (key.toLowerCase() === lowerPath ||
          key.toLowerCase() === pathWithoutSlash.toLowerCase() ||
          '/' + key.toLowerCase() === lowerPath) {
        return part;
      }
    }

    return null;
  }

  getPartsByPrefix(prefix: string): ZipPart[] {
    const result: ZipPart[] = [];
    const norm = prefix.replace(/^\/+/, '').toLowerCase();
    for (const [key, part] of this.parts.entries()) {
      const k = key.toLowerCase();
      if (k === norm || k.startsWith(norm + '/') || k.startsWith(norm)) {
        result.push(part);
      }
    }
    return result;
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
