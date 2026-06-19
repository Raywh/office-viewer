import { DocumentParser, ParseOptions, WordDocument as ParserWordDocument } from './document-parser';

export async function parseAsync(
  data: ArrayBuffer | Blob | File,
  options?: ParseOptions
): Promise<ParserWordDocument> {
  let buffer: ArrayBuffer;

  if (data instanceof Blob || data instanceof File) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = data;
  }

  const zipPackage = await (await import('@office-viewer/core')).ZipPackage.create(buffer);
  const parser = new DocumentParser(zipPackage, options);
  return await parser.parse();
}

export type { ParseOptions };
export type { WordDocument, Paragraph, Table, TableRow, TableCell, Run, Drawing, Hyperlink, TabChar, Break, Text } from './document-parser';
export { DocumentParser } from './document-parser';
