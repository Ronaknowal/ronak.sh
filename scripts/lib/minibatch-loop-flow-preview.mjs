import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  root: `${repo}docs/teaching/deep-learning-beginner/mini-batches-training-loops-gradient-accumulation/preview`,
  publicDir: `${repo}public`, plugins: [react()],
  resolve: { alias: { '/src': `${repo}src` } },
  server: { host: '127.0.0.1', port: 4863, strictPort: true, fs: { allow: [repo] } },
  build: { outDir: `${repo}scratch/reading-flow/minibatch-flow-production`, emptyOutDir: false },
});
