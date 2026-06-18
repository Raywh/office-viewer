export type FileFormat = 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'unknown';

const ZIP_MAGIC = [0x50, 0x4b];
const CFB_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const EXTENSION_MAP: Record<string, FileFormat> = {
  '.doc': 'doc',
  '.docx': 'docx',
  '.ppt': 'ppt',
  '.pptx': 'pptx',
  '.xls': 'xls',
  '.xlsx': 'xlsx',
};

const MIME_TYPE_MAP: Record<string, FileFormat> = {
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

export function detectFormat(
  data: ArrayBuffer | Blob | File,
  options?: { filename?: string; mimeType?: string }
): FileFormat {
  if (options?.filename) {
    const ext = options.filename.toLowerCase().slice(-5);
    for (const [extKey, format] of Object.entries(EXTENSION_MAP)) {
      if (ext.endsWith(extKey)) {
        return format;
      }
    }
  }

  if (options?.mimeType && MIME_TYPE_MAP[options.mimeType]) {
    return MIME_TYPE_MAP[options.mimeType];
  }

  if (data instanceof Blob || data instanceof File) {
    return new Promise(async (resolve) => {
      const buffer = await data.slice(0, 32).arrayBuffer();
      resolve(detectFromArrayBuffer(buffer));
    }) as unknown as FileFormat;
  }

  return detectFromArrayBuffer(data);
}

function detectFromArrayBuffer(data: ArrayBuffer): FileFormat {
  const view = new Uint8Array(data);

  if (isZipFormat(view)) {
    return detectZipFormat(data);
  }

  if (isCompoundFileBinary(view)) {
    return detectCfbFormat(data);
  }

  return 'unknown';
}

function isZipFormat(view: Uint8Array): boolean {
  return view[0] === ZIP_MAGIC[0] && view[1] === ZIP_MAGIC[1];
}

function isCompoundFileBinary(view: Uint8Array): boolean {
  if (view.length < 8) return false;
  for (let i = 0; i < CFB_MAGIC.length; i++) {
    if (view[i] !== CFB_MAGIC[i]) return false;
  }
  return true;
}

function detectZipFormat(data: ArrayBuffer): FileFormat {
  try {
    const view = new Uint8Array(data);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });

    const zipScan = scanForZipSignatures(view);

    if (zipScan.includes('word/')) return 'docx';
    if (zipScan.includes('ppt/')) return 'pptx';
    if (zipScan.includes('xl/')) return 'xlsx';

    if (zipScan.includes('[Content_Types]')) {
      const contentTypes = extractContentTypes(view);
      if (contentTypes.includes('wordprocessingml')) return 'docx';
      if (contentTypes.includes('presentationml')) return 'pptx';
      if (contentTypes.includes('spreadsheetml')) return 'xlsx';
    }

    return 'docx';
  } catch {
    return 'docx';
  }
}

function detectCfbFormat(data: ArrayBuffer): FileFormat {
  try {
    const view = new Uint8Array(data);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });

    const scan = textDecoder.decode(view.slice(0, Math.min(1024, view.length)));

    if (scan.includes('WordDocument')) return 'doc';
    if (scan.includes('PowerPoint')) return 'ppt';
    if (scan.includes('Workbook')) return 'xls';

    if (scan.includes('Microsoft Word')) return 'doc';
    if (scan.includes('Microsoft PowerPoint')) return 'ppt';
    if (scan.includes('Microsoft Excel')) return 'xls';

    return 'doc';
  } catch {
    return 'doc';
  }
}

function scanForZipSignatures(view: Uint8Array): string {
  const result: string[] = [];
  const textDecoder = new TextDecoder('utf-8', { fatal: false });

  for (let i = 0; i < Math.min(view.length - 100, 65536); i += 2) {
    if (view[i] === 0x50 && view[i + 1] === 0x4b) {
      if (i + 30 < view.length) {
        const nameLen = view[i + 26] | (view[i + 27] << 8);
        if (nameLen > 0 && i + 30 + nameLen < view.length) {
          const name = textDecoder.decode(view.slice(i + 30, i + 30 + nameLen));
          result.push(name);
        }
      }
    }
  }

  return result.join('|');
}

function extractContentTypes(view: Uint8Array): string {
  const textDecoder = new TextDecoder('utf-8', { fatal: false });

  for (let i = 0; i < Math.min(view.length - 100, 131072); i += 2) {
    if (view[i] === 0x50 && view[i + 1] === 0x4b) {
      if (i + 30 < view.length) {
        const nameLen = view[i + 26] | (view[i + 27] << 8);
        const extraLen = view[i + 28] | (view[i + 29] << 8);
        if (nameLen > 0 && i + 30 + nameLen < view.length) {
          const name = textDecoder.decode(view.slice(i + 30, i + 30 + nameLen));
          if (name.includes('Content_Types')) {
            const dataStart = i + 30 + nameLen + extraLen;
            const compressedSize = view[i + 18] | (view[i + 19] << 8) | (view[i + 20] << 16) | (view[i + 21] << 24);
            if (dataStart + compressedSize < view.length) {
              return textDecoder.decode(view.slice(dataStart, dataStart + Math.min(compressedSize, 4096)));
            }
          }
        }
      }
    }
  }

  return '';
}

