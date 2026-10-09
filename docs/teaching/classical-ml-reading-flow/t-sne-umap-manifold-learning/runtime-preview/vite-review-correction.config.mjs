import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from './vite.config.mjs';

// One independent-review successor. Prior5193/5194 builds and receipts stay intact.
// Inherit the pre-resolver, foreign-body guard and exact35 file middleware.
const owner = path.dirname(fileURLToPath(import.meta.url));
export default {
  ...base,
  publicDir: false,
  server: { ...base.server, port: 5195, strictPort: true },
  preview: { ...base.preview, port: 5195, strictPort: true },
  build: { ...base.build, outDir: path.join(owner, 'build-review-corrected'), emptyOutDir: false },
};
