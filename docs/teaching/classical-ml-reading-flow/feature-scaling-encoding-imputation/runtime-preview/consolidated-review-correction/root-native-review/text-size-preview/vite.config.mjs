import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../../vite.config.mjs';

const owner = path.dirname(fileURLToPath(import.meta.url));
const sourceOwner = path.resolve(owner, '../..');
const normalize = id => id.split('?')[0].replaceAll('\\', '/');
const entry = path.join(owner, 'preview-entry.jsx');
const textSizeHarness = {
  name: 'feature20-private-root-text-size-harness',
  enforce: 'pre',
  resolveId(source, importer) {
    if (source === '/preview-entry.jsx') return entry;
    if (importer && source.startsWith('.') &&
      normalize(path.resolve(path.dirname(normalize(importer)), source)) ===
      normalize(path.join(sourceOwner, 'preview-entry.jsx'))) return entry;
  }
};

export default {
  ...base,
  plugins: [textSizeHarness, ...base.plugins],
  cacheDir: path.join(owner, '.vite-cache'),
  server: { ...base.server, port: 5207, strictPort: true },
  preview: { ...base.preview, port: 5207, strictPort: true },
  build: { ...base.build, outDir: path.join(owner, 'build-private'), emptyOutDir: false }
};
