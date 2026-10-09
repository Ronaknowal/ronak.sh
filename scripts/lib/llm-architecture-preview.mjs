// Topic-only staged source substitution in the real reader; no publication edits.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const root = process.cwd();
const folder = 'docs/teaching/llm-architecture-training';
const candidates = {
  'dynamic-tokenization.jsx': `${folder}/dynamic-tokenization-adat-boundlessbpe-litetoken/manuscript.jsx`,
  'scaling-laws.jsx': `${folder}/scaling-laws-kaplan-chinchilla-beyond/scaling-laws.jsx`,
  'causal-language-modeling.jsx': `${folder}/causal-language-modeling-next-token-prediction/causal-language-modeling.jsx`,
  'masked-language-modeling.jsx': `${folder}/masked-language-modeling-bert-style/manuscript.jsx`,
  'data-curation-deduplication.jsx': `${folder}/data-curation-deduplication-minhash-bloom-filters/data-curation-deduplication.jsx`,
};
const mapping = new Map(Object.entries(candidates).map(([name, draft]) => [path.resolve(root, 'src/learn/data/topics', name).replaceAll('\\','/'), path.resolve(root,draft)]));
const server = await createServer({
  configFile: false, root, cacheDir: 'scratch/llm-architecture-vite-cache',
  optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react-router-dom', 'react-markdown', 'remark-gfm', 'cookie', 'katex'] },
  plugins: [{
    name: 'llm-architecture-staged-reader', enforce: 'pre',
    load(id) {
      const draft = mapping.get(id.split('?')[0].replaceAll('\\','/'));
      if (draft && fs.existsSync(draft)) return fs.readFileSync(draft,'utf8');
    },
    configureServer(s) {
      s.middlewares.use((request,response,next) => {
        if (request.url !== '/__llm_refresh') return next();
        s.moduleGraph.invalidateAll();
        response.end('Staged source cache refreshed');
      });
      for (const file of mapping.values()) s.watcher.add(file);
      s.watcher.on('change', file => {
        if ([...mapping.values()].includes(path.resolve(file))) {
          s.moduleGraph.invalidateAll();
          s.ws.send({type:'full-reload'});
        }
      });
    },
  }, react()],
  server: {host:'127.0.0.1', port:4243, strictPort:true, watch: null},
});
await server.listen();
server.printUrls();
console.log(`LLM staged preview PID ${process.pid}`);
