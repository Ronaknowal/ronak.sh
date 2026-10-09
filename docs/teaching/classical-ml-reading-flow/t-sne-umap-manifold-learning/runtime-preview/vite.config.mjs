import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const owner = path.dirname(fileURLToPath(import.meta.url)), app = path.resolve(owner, '../../../../..');
const bundle = JSON.parse(fs.readFileSync(path.resolve(owner, '../content-authoring/review-correction/program-bundle.json'), 'utf8'));
const prefix = '/learn-assets/t-sne-umap-private/';
const payloads = new Map(bundle.files.map(file => [prefix + file.destination, path.resolve(app, file.source.path)]));
const normalize = id => id.split('?')[0].replaceAll('\\', '/');
const foreignBody = id => normalize(id).includes('/src/learn/data/topics/') || normalize(id).endsWith('/src/learn/data/generated/lesson-imports.js');
function exactFiles() {
  const middleware = (req, res, next) => {
    const file = payloads.get((req.url || '').split('?')[0]);
    if (!file) { if ((req.url || '').startsWith(prefix)) { res.statusCode = 404; res.end('Unknown exact lesson file'); } else next(); return; }
    res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).on('error', () => { res.statusCode = 500; res.end('Exact source unavailable'); }).pipe(res);
  };
  return {
    name: 'exact-private-manifold-files',
    // Vite's ordinary resolver precedes normal user plugins. The loader must
    // be intercepted before it resolves to the generated full-site import map.
    enforce: 'pre',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
    resolveId(source, importer) {
      const from = importer && normalize(importer);
      if (normalize(source).endsWith('lesson-loader.js') && from?.endsWith('/src/learn/hooks/useTopicResource.js')) {
        return path.join(owner, 'preview-loader.js');
      }
      const resolved = source.startsWith('.') && from ? path.resolve(path.dirname(from), source) : source;
      if (foreignBody(resolved)) this.error(`Foreign lesson body forbidden in private topic harness: ${resolved}`);
    },
    moduleParsed(info) {
      if (foreignBody(info.id)) this.error(`Foreign lesson body reached private topic build: ${info.id}`);
    },
    generateBundle(_options, output) {
      const moduleIds = [...new Set(Object.values(output).filter(row => row.type === 'chunk').flatMap(row => Object.keys(row.modules)))];
      if (moduleIds.some(foreignBody)) this.error('Private topic bundle contains a foreign lesson body');
      const files = [...new Set(moduleIds.filter(id => !id.startsWith('\0')).map(normalize))]
        .filter(file => fs.existsSync(file) && fs.statSync(file).isFile());
      const sourceBindings = files.map(file => {
        const raw = fs.readFileSync(file);
        return { path: path.relative(app, file).replaceAll('\\', '/'), bytes: raw.length,
          sha256: crypto.createHash('sha256').update(raw).digest('hex') };
      });
      this.emitFile({ type: 'asset', fileName: 'private-module-map.json', source: JSON.stringify({
        schema: 'private-topic-built-module-map/v1', publicDir: false,
        topic: 't-sne-umap-manifold-learning', foreignLessonBodies: [],
        moduleIds: moduleIds.map(id => id.startsWith('\0') ? id : path.relative(app, id).replaceAll('\\', '/')),
        sourceBindings,
      }, null, 2) + '\n' });
    },
  };
}
export default defineConfig({
  root: owner,
  publicDir: false,
  cacheDir: path.join(owner, '.vite-cache'),
  plugins: [exactFiles(), react()],
  server: { host: '127.0.0.1', port: 5193, strictPort: true, fs: { allow: [app] } },
  preview: { host: '127.0.0.1', port: 5193, strictPort: true },
  build: { outDir: path.join(owner, 'build-private-r2'), emptyOutDir: false, sourcemap: false, manifest: true },
});
