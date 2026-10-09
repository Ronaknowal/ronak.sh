import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

// Keep the shared verifier untouched while checking this task's isolated build.
const filename = 'scripts/verify-site-build.mjs';
const source = fs.readFileSync(filename, 'utf8');
const build = process.env.TOKENIZATION_BUILD_DIR || 'dist-tokenization-flow';
const adapted = source
  .replace('"./lib/article-content.mjs"', JSON.stringify(pathToFileURL(path.resolve('scripts/lib/article-content.mjs')).href))
  .replace('fileURLToPath(new URL("..", import.meta.url))', 'process.cwd()')
  .replaceAll('"dist/.vite/manifest.json"', JSON.stringify(`${build}/.vite/manifest.json`))
  .replaceAll('"dist/articles"', JSON.stringify(`${build}/articles`))
  .replaceAll('"dist"', JSON.stringify(build));
await import(`data:text/javascript;base64,${Buffer.from(adapted).toString('base64')}`);
fs.mkdirSync('docs/teaching/tokenization/reading-flow-evidence', { recursive: true });
fs.writeFileSync(process.env.TOKENIZATION_SITE_OUTPUT || 'docs/teaching/tokenization/reading-flow-evidence/site-build.json', JSON.stringify({
  checkedAt: new Date().toISOString(), passed: true, build,
  originalVerifier: filename,
  originalVerifierSha256: createHash('sha256').update(source).digest('hex'),
  buildManifestSha256: createHash('sha256').update(fs.readFileSync(`${build}/.vite/manifest.json`)).digest('hex'),
  adaptations: ['isolated build directory', 'original root and helper import resolution'],
}, null, 2) + '\n');
