import { readFile } from 'fs/promises';
import path from 'path';
import type { RequestHandler } from '../$types';

const staticDir = "/tmp";
console.log("[DEBUG] ", { staticDir });

function getFilePath(fileName: string) {
  const baseName = path.basename(fileName);
  return path.resolve(staticDir, baseName);
}

export const GET: RequestHandler = async ({ params }) => {
  const { filename } = params;
  const content = await readFile(getFilePath(filename));
  return new Response(content, {
    headers: {
      'Content-type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${filename}"`
    },
  });
}
