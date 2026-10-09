// Run the existing production loading/recovery verifier against an isolated
// tokenization build without modifying its frozen source or another task's dist.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { createHash } = require('node:crypto');
const filename = path.resolve(__dirname, 'verify-learning-load-boundaries.cjs');
const build = process.env.TOKENIZATION_BUILD_DIR || 'dist-tokenization-flow';
const output = process.env.TOKENIZATION_LOADING_OUTPUT ||
  'docs/teaching/tokenization/reading-flow-evidence/load-boundaries.json';
const source = fs.readFileSync(filename, 'utf8');
const hash = createHash('sha256').update(source).digest('hex');
const adapted = source
  .replaceAll("'dist/", `'${build}/`)
  .replaceAll('`dist/', `\`${build}/`)
  .replaceAll("'scratch/learning-performance'", JSON.stringify(path.dirname(output)))
  .replaceAll("'scratch/learning-performance/load-boundaries.json'", JSON.stringify(output));
if (adapted.includes("'dist/") || adapted.includes('`dist/')) throw new Error('Unadapted build path');
fs.mkdirSync(path.dirname(output), { recursive: true });
console.log(JSON.stringify({ originalVerifier: filename, sourceSha256: hash,
  adaptations: ['build directory', 'result path'], build, output }));
const runner = new Module(filename, module);
runner.filename = filename;
runner.paths = Module._nodeModulePaths(path.dirname(filename));
runner._compile(adapted, filename);
