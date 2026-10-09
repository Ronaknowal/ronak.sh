const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const directory = process.env.LLM_INTEGRATION_DIRECTORY;
assert.ok(directory);
const publication = JSON.parse(fs.readFileSync(`${directory}/publication.json`));
const original = path.resolve('scripts/verify-learning-load-boundaries.cjs');
const source = fs.readFileSync(original, 'utf8')
  .replaceAll("'dist/.vite/manifest.json'", JSON.stringify(`${publication.build}/.vite/manifest.json`))
  .replaceAll("'dist/assets'", JSON.stringify(`${publication.build}/assets`))
  .replaceAll('`dist/assets/${name}`', '`'+publication.build+'/assets/${name}`')
  .replaceAll("'scratch/learning-performance/load-boundaries.json'", JSON.stringify(`${directory}/load-boundaries.json`));
process.argv = [process.argv[0], original, '--topics', publication.rows.map(r => r.id).join(',')];
process.env.PERFORMANCE_BASE_URL = process.env.LLM_PRODUCTION_BASE || 'http://127.0.0.1:4251';
const runner = new Module(original, module);
runner.filename = original;
runner.paths = Module._nodeModulePaths(path.dirname(original));
runner._compile(source, original);
