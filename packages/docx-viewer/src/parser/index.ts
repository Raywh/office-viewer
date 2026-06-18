import { ZipPackage } from '@office-viewer/core';
import { WordDocument } from '../model/document';
import { DocumentParser, ParseOptions } from './document-parser';

export async function parseAsync(
  data: ArrayBuffer | Blob | File,
  options?: ParseOptions
): Promise<WordDocument> {
  let buffer: ArrayBuffer;

  if (data instanceof Blob || data instanceof File) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = data;
  }

  const zipPackage = new ZipPackage(buffer);
  const parser = new DocumentParser(zipPackage, options);

  return await parser.parse();
}

export { ParseOptions } from './document-parser';
export { WordDocument } from '../model/document';
