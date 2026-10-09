// Source-current accepted content in the actual reader, without publication edits.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const [portText = '4264', owner = 'root'] = process.argv.slice(2);
const port = Number(portText);
assert.ok([4261, 4262, 4263, 4264].includes(port), 'Use an assigned private preview port');
const root = process.cwd();
const base = 'docs/teaching/llm-architecture-training';
const scope = JSON.parse(fs.readFileSync(`${base}/inference-serving-scope.json`, 'utf8'));
assert.ok(scope.topics.some((row) => row.owner === owner));
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const normalize = (file) => path.resolve(file).replaceAll('\\', '/');
const navigation = normalize('src/learn/data/generated/navigation.js');

function prepared() {
  const ledger = JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json', 'utf8'));
  return scope.topics.filter((row) => row.owner === owner || (owner === 'root' && row.id === 'structured-output-constrained-decoding-outlines-xgrammar')).flatMap((row) => {
    const entry = ledger.topics[row.id];
    if (entry.content.status !== 'complete') return [];
    const manuscript = entry.content.manuscript;
    assert.equal(sha(manuscript), entry.content.files[manuscript], 'Accepted manuscript changed');
    const draft = path.join(path.dirname(manuscript), 'lesson.jsx');
    if (!fs.existsSync(draft)) return [];
    const source = fs.readFileSync(draft, 'utf8');
    const readTime = source.match(/readTime:\s*['"]([^'"]+)['"]/)?.[1];
    return [{ id: row.id, published: normalize(row.source), draft: normalize(draft), readTime }];
  });
}

let entries = prepared();
const server = await createServer({
  configFile: false,
  root,
  cacheDir: `scratch/llm-inference-preview-${owner}`,
  optimizeDeps: {
    noDiscovery: true,
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react-router-dom', 'react-markdown', 'remark-gfm', 'cookie', 'katex'],
  },
  plugins: [{
    name: 'accepted-inference-lesson-preview',
    enforce: 'pre',
    load(id) {
      const file = id.split('?')[0].replaceAll('\\', '/');
      const entry = entries.find((row) => row.published === file);
      if (entry) return fs.readFileSync(entry.draft, 'utf8').replaceAll('../../../../src/learn/', '../../');
      if (file === navigation) {
        return fs.readFileSync(file, 'utf8') + `\nfor (const entry of ${JSON.stringify(entries.map(({ id, readTime }) => ({ id, readTime })))}) { const row = allTopicsOrdered.find(topic => topic.id === entry.id); if (row && entry.readTime) row.readTime = entry.readTime; }\n`;
      }
    },
    configureServer(vite) {
      vite.middlewares.use((request, response, next) => {
        if (request.url !== '/__llm_refresh') return next();
        entries = prepared();
        vite.moduleGraph.invalidateAll();
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ owner, port, routes: entries.map((row) => row.id) }));
      });
    },
  }, react()],
  server: { host: '127.0.0.1', port, strictPort: true, watch: null },
});
await server.listen();
server.printUrls();
console.log(`LLM inference preview owner ${owner}; PID ${process.pid}; ${entries.length} accepted staged routes`);

