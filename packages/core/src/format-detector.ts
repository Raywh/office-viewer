export type FileFormat = 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'unknown';

/**
 * Detect Office file format from ArrayBuffer
 */
export function detectFormat(data: ArrayBuffer): FileFormat {
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
  return view[0] === 0x50 && view[1] === 0x4b;
}

function isCompoundFileBinary(view: Uint8Array): boolean {
  return (
    view[0] === 0xd0 &&
    view[1] === 0xcf &&
    view[2] === 0x11 &&
    view[3] === 0xe0
  );
}

function detectZipFormat(data: ArrayBuffer): FileFormat {
  return 'docx';
}

function detectCfbFormat(data: ArrayBuffer): FileFormat {
  return 'doc';
}
