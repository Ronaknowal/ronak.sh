import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { llmBuild, llmIntegration } from './lib/llm-pretraining-integration.mjs';

const sourcePath = path.resolve('scripts/verify-site-build.mjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const adapted = source
  .replaceAll('"dist/', `"${llmBuild}/`)
  .replaceAll('"dist"', JSON.stringify(llmBuild))
  .replaceAll('import.meta.url', JSON.stringify(pathToFileURL(sourcePath).href))
  .replace('"./lib/article-content.mjs"', JSON.stringify(pathToFileURL(path.resolve('scripts/lib/article-content.mjs')).href));
await import(`data:text/javascript;base64,${Buffer.from(adapted).toString('base64')}`);
fs.writeFileSync(`${llmIntegration}/site-build.json`, JSON.stringify({
  at: new Date().toISOString(), passed: true, build: llmBuild,
  originalVerifier: 'scripts/verify-site-build.mjs',
  originalSha256: createHash('sha256').update(source).digest('hex'),
  adaptations: ['Isolated build directory', 'Resolve original module URLs'],
}, null, 2) + '\n');
