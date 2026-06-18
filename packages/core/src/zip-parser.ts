export interface ZipPart {
  path: string;
  contentType?: string;
  data: ArrayBuffer;
}

export interface PackageRelationship {
  id: string;
  type: string;
  target: string;
}

export class ZipPackage {
  private parts: Map<string, ZipPart> = new Map();

  constructor(data: ArrayBuffer) {
    this.parse(data);
  }

  private parse(data: ArrayBuffer): void {
  }

  getPart(path: string): ZipPart | null {
    return this.parts.get(path) || null;
  }

  getPartsByContentType(contentType: string): ZipPart[] {
    return [];
  }

  getRelationships(partPath?: string): PackageRelationship[] {
    return [];
  }
}
