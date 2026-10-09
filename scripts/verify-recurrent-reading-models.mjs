import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const folder = 'docs/teaching/deep-learning-beginner/rnns-lstms-grus/';
const hash = value => createHash('sha256').update(value).digest('hex');
const identities = [];
for (const receipt of ['recurrent-native.json', 'recurrent-independent-native.json']) {
  const historical = JSON.parse(fs.readFileSync('docs/teaching/evidence/' + receipt));
  assert.equal(historical.passed, true);
  for (const [path, recorded] of Object.entries(historical.sourceHashes)) {
    const bytes = fs.readFileSync(path), currentRaw = hash(bytes), currentLF = hash(bytes.toString().replaceAll('\r\n', '\n'));
    assert.ok(currentRaw === recorded || currentLF === recorded, `Changed scientific dependency: ${path}`);
    identities.push({ receipt, path, recorded, currentRaw, currentLF, equivalence: currentRaw === recorded ? 'raw' : 'CRLF-to-LF only' });
  }
}
// Replay the existing meaningful JS comparisons; only identity adaptation and
// output redirection change. Never write the historical receipt locations.
for (const [script, oldOutput, currentOutput] of [
  ['scripts/verify-recurrent-models.mjs', 'docs/teaching/evidence/recurrent-author.json', folder + 'reading-flow-models.json'],
  ['scripts/verify-recurrent-independent.mjs', 'docs/teaching/evidence/recurrent-independent-models.json', folder + 'reading-flow-independent-models.json'],
]) {
  let source = fs.readFileSync(script, 'utf8');
  const pattern = /for \(const \[path, hash\] of Object\.entries\((?:native|evidence)\.sourceHashes\)\) assert\.equal\(createHash\('sha256'\)\.update\(fs\.readFileSync\(path\)\)\.digest\('hex'\), hash(?:, path)?\);/;
  assert.ok(pattern.test(source));
  source = source.replace(pattern, '// Scientific dependency identity independently checked by wrapper, including explicit LF-only conversion.');
  assert.ok(source.includes(oldOutput));
  source = source.replace(oldOutput, currentOutput);
  const temporary = 'scripts/.recurrent-reading-model-replay.mjs';
  try {
    fs.writeFileSync(temporary, source);
    await import(new URL('../' + temporary, import.meta.url).href + '?run=' + Date.now());
  } finally { fs.rmSync(temporary, { force: true }); }
}
fs.writeFileSync(folder + 'reading-flow-scientific-dependencies.json', JSON.stringify({ passed: true, identities,
  sourceHashes: Object.fromEntries(['scripts/verify-recurrent-reading-models.mjs', 'src/learn/data/recurrent-models.js'].map(p => [p, hash(fs.readFileSync(p))])),
  limits: 'Existing native inference/gradient receipts reused by proven scientific identity. Current JS comparisons executed. No new handwriting fits.' }, null, 2) + '\n');
console.log('PASS: conserved scientific dependencies and current model comparisons.');
