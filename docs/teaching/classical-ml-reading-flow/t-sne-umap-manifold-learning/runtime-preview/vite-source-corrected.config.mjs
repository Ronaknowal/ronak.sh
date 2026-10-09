import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from './vite.config.mjs';

// Preserve build-private-r2 and its live5193 preview. The inherited pre-resolver
// and exact35 payload middleware retain the already-corrected private scope.
const owner = path.dirname(fileURLToPath(import.meta.url));
export default {
  ...base,
  server: { ...base.server, port: 5194, strictPort: true },
  preview: { ...base.preview, port: 5194, strictPort: true },
  build: { ...base.build, outDir: path.join(owner, 'build-source-corrected'), emptyOutDir: false },
};
