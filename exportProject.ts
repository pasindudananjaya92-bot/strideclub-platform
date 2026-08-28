import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';
import { Response } from 'express';

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  '.drizzle',
  '.env',
  '.DS_Store',
  'coverage',
];

export function streamProjectZip(res: Response) {
  const rootDir = process.cwd();
  const archive = new ZipArchive({
    zlib: { level: 9 }, // Maximum compression
  });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="strideclub-platform-source.zip"');

  archive.on('error', (err: any) => {
    console.error('Archive error:', err);
    if (!res.headersSent) {
      res.status(500).send({ error: 'Failed to generate project archive' });
    }
  });

  archive.pipe(res);

  function addDirectory(currentDir: string, relativePath: string = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const entryRelPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

      if (IGNORED_PATHS.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        addDirectory(fullPath, entryRelPath);
      } else if (entry.isFile()) {
        archive.file(fullPath, { name: entryRelPath });
      }
    }
  }

  try {
    addDirectory(rootDir);
    archive.finalize();
  } catch (err) {
    console.error('Error walking directory for zip:', err);
    archive.abort();
  }
}

