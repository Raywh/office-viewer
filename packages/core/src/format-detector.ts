export type FileFormat = 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'unknown';

const ZIP_MAGIC = [0x50, 0x4b];
const CFB_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const EXTENSION_MAP: Record<string, FileFormat> = {
  '.doc': 'doc',
  '.docx': 'docx',
  '.docm': 'docx',
  '.dotx': 'docx',
  '.ppt': 'ppt',
  '.pptx': 'pptx',
  '.pptm': 'pptx',
  '.xls': 'xls',
  '.xlsx': 'xlsx',
  '.xlsm': 'xlsx',
};

export function detectFormat(
  data: ArrayBuffer | Blob | File,
  options?: { filename?: string; mimeType?: string }
): FileFormat {
  // 1. By extension (fastest, covers most cases)
  if (options?.filename) {
    const lower = options.filename.toLowerCase();
    for (const [ext, fmt] of Object.entries(EXTENSION_MAP)) {
      if (lower.endsWith(ext)) return fmt;
    }
  }

  // 2. By content inspection for ArrayBuffer
  if (data instanceof ArrayBuffer) {
    return detectFromArrayBuffer(data);
  }

  return 'unknown';
}

function detectFromArrayBuffer(data: ArrayBuffer): FileFormat {
  const view = new Uint8Array(data);

  if (isZipFormat(view)) {
    return detectZipFormat(data, view);
  }

  if (isCompoundFileBinary(view)) {
    return detectCfbFormat(data, view);
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

function detectZipFormat(_data: ArrayBuffer, view: Uint8Array): FileFormat {
  // Scan local file records to find known OOXML part names.
  // We search for path fragments like "word/" or "ppt/slides/" inside the local file headers.
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const scanLimit = Math.min(view.length, 512 * 1024);

  let offset = 0;
  const found: Record<string, boolean> = { word: false, ppt: false, xl: false };

  while (offset < scanLimit - 30) {
    if (view[offset] === 0x50 && view[offset + 1] === 0x4b &&
        view[offset + 2] === 0x03 && view[offset + 3] === 0x04) {
      // Local file header signature; read file name length.
      const fileNameLength = view[offset + 26] | (view[offset + 27] << 8);
      const extraFieldLength = view[offset + 28] | (view[offset + 29] << 8);
      if (offset + 30 + fileNameLength > view.length) break;
      const name = textDecoder.decode(view.slice(offset + 30, offset + 30 + fileNameLength)).toLowerCase();

      if (name.startsWith('word/')) found.word = true;
      if (name.startsWith('ppt/')) found.ppt = true;
      if (name.startsWith('xl/')) found.xl = true;

      offset += 30 + fileNameLength + extraFieldLength + 4; // advance roughly
    } else {
      offset++;
    }
  }

  if (found.word) return 'docx';
  if (found.xl) return 'xlsx';
  if (found.ppt) return 'pptx';

  // Fallback: scan content types
  const ctScanLimit = Math.min(view.length, 512 * 1024);
  const firstKB = textDecoder.decode(view.slice(0, ctScanLimit));
  if (firstKB.includes('wordprocessingml')) return 'docx';
  if (firstKB.includes('spreadsheetml')) return 'xlsx';
  if (firstKB.includes('presentationml')) return 'pptx';

  return 'unknown';
}

function detectCfbFormat(_data: ArrayBuffer, view: Uint8Array): FileFormat {
  // CFB (binary Office). Read the directory / stream names to detect the kind.
  // Lightweight approach: look for known signature strings in the first bytes.
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const scanLen = Math.min(view.length, 256 * 1024);
  const scan = decoder.decode(view.slice(0, scanLen));

  if (scan.includes('WordDocument')) return 'doc';
  if (scan.includes('Workbook') || scan.includes('\x05Book')) return 'xls';
  if (scan.includes('PowerPoint') || scan.includes('Current User')) return 'ppt';

  return 'unknown';
}
