import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const base = 'docs/teaching/llm-architecture-training/constitutional-ai-cai';
const folder = `${base}/review-successor`;
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const predecessor = JSON.parse(fs.readFileSync(`${base}/runtime-inputs.json`, 'utf8'));
const expectedChanges = new Set([
  `${base}/manuscript.jsx`,
  'src/learn/components/lesson-labs/ConstitutionalAIFlow.jsx',
  'src/learn/data/constitutional-ai-models.js',
]);
const changes = [];
const files = new Map();
function bind(file) {
  const bytes = fs.readFileSync(file);
  const row = { path: file.replaceAll('\\', '/'), sha256: digest(bytes), bytes: bytes.length };
  files.set(row.path, row);
  return row;
}
for (const old of predecessor.files) {
  const current = bind(old.path);
  if (current.sha256 !== old.sha256) {
    assert.ok(expectedChanges.has(old.path), `Unexpected changed binding: ${old.path}`);
    changes.push({ path: old.path, predecessor: old.sha256, successor: current.sha256 });
  }
}
assert.equal(changes.length, 3);
function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = `${directory}/${item.name}`;
    if (item.isDirectory()) walk(file);
    else if (file !== `${folder}/inputs.json`) bind(file);
  }
}
walk(folder);
for (const file of [
  `${base}/runtime-inputs.json`,
  `${base}/runtime-review.md`,
  'scripts/verify-cai-review-corrections.mjs',
  'scripts/verify-cai-review-corrections-browser.cjs',
  'scripts/format-constitutional-ai-review-successor.mjs',
  'scripts/freeze-cai-review-successor.mjs',
]) bind(file);
const checks = JSON.parse(fs.readFileSync(`${folder}/correction-checks-final.json`));
const browser = JSON.parse(fs.readFileSync(`${folder}/browser-final-corrections/report.json`));
assert.equal(checks.status, 'passed');
assert.equal(checks.conditions, 77);
assert.equal(browser.status, 'passed');
assert.equal(browser.checks.length, 71);
assert.equal(browser.captures.length, 82);
for (const changed of changes) {
  assert.equal(checks.files[changed.path], changed.successor);
  assert.equal(browser.files[changed.path], changed.successor);
}
const output = {
  status: 'author-corrections-frozen-ready-for-different-closure',
  predecessor_manifest_sha256: digest(fs.readFileSync(`${base}/runtime-inputs.json`)),
  predecessor_files: predecessor.files.length,
  unchanged_predecessor_files: predecessor.files.length - changes.length,
  changes,
  scientific_programs_data_and_native_studies_unchanged: true,
  new_conditions: 77,
  browser_conditions: 71,
  browser_captures: 82,
  files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
};
fs.writeFileSync(`${folder}/inputs.json`, JSON.stringify(output, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, bindings: output.files.length, changes, sha256: digest(fs.readFileSync(`${folder}/inputs.json`)) }, null, 2));
