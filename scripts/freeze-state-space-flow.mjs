import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const id = 'state-space-models-s4-mamba-mamba-2';
const folder = `docs/teaching/deep-learning-beginner/${id}`;
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = name => JSON.parse(fs.readFileSync(`${folder}/${name}`));
const scientific = read('reading-flow-scientific-dependencies.json');
const native = read('reading-flow-native.json');
const finalBrowser = read(process.argv.includes('--reviewed') ? 'reading-flow-reviewed-browser.json' : 'reading-flow-final-browser.json');
const originalBrowser = read('reading-flow-browser.json');
const layout = read('reading-flow-layout-draft.json');
assert.equal(scientific.passed, true);
assert.equal(native.passed, true);
assert.equal(native.checks.length, 464);
assert.equal(finalBrowser.status, 'passed');
assert.equal(originalBrowser.status, 'passed');
assert.equal(finalBrowser.reused.sha256, hash(finalBrowser.reused.path));
assert.equal(layout.errors.length, 0);
assert(!layout.failure);
for (const { figures } of layout.layouts) for (const figure of figures) {
  assert.equal(figure.outOfBounds.length + figure.overlaps.length + figure.wireLabels.length, 0, figure.name);
}
for (const [file, identity] of Object.entries(scientific.sourceHashes)) assert.equal(hash(file), identity.sha256, file);
for (const [file, digest] of Object.entries(native.sourceHashes)) assert.equal(hash(file), digest, file);
for (const receipt of [finalBrowser, layout]) for (const [file, digest] of Object.entries(receipt.sourceHashes)) assert.equal(hash(file), digest, file);

const runtime = Object.keys(finalBrowser.sourceHashes).filter(file => file.startsWith('src/'));
const programs = Object.keys(native.sourceHashes).filter(file => file.startsWith('public/'));
const checks = ['scripts/verify-state-space-flow-native.py', 'scripts/verify-state-space-flow-dependencies.mjs', 'scripts/verify-state-space-flow-browser.cjs', 'scripts/verify-state-space-flow-final-browser.cjs', 'scripts/verify-state-space-flow-layout.cjs', 'scripts/format-state-space-flow.mjs', 'scripts/freeze-state-space-flow.mjs'];
const records = [`${folder}/reading-flow-revision.md`, 'docs/teaching/deep-learning-beginner/original/state-space-before-reading-flow/accepted-reading-flow-design.md'];
const sourceHashes = Object.fromEntries([...new Set([...runtime, ...programs, ...Object.keys(scientific.sourceHashes), ...checks, ...records])].map(file => [file, hash(file)]));
const evidenceNames = ['reading-flow-native.json', 'reading-flow-native-foundation.json', 'reading-flow-native-rotating-frame.json', 'reading-flow-browser.json', 'reading-flow-final-browser.json', 'reading-flow-layout-draft.json', 'reading-flow-formatting.json', 'reading-flow-scientific-dependencies.json', 'reading-flow-prototype.json', 'reading-flow-design-independent.json', 'reading-flow-early-whole-source.json'];
if (process.argv.includes('--reviewed')) evidenceNames.push('reading-flow-reviewed-browser.json');
const evidenceHashes = Object.fromEntries(evidenceNames.map(name => [`${folder}/${name}`, hash(`${folder}/${name}`)]));
const receipt = {
  topic: id,
  capturedAt: new Date().toISOString(),
  status: 'Author source-ready candidate; independent final source closure and parent shared integration still required',
  scope: 'DL18 only; stable ID, anchors, all original science, nine practices and four recorded fits retained',
  sourceHashes,
  evidenceHashes,
  checks: { native: native.checks.length, originalTopicBrowser: originalBrowser.checks.length, finalPresentationBrowser: finalBrowser.checks.length, conservedScience: Object.keys(scientific.sourceHashes).length, currentGeometryFindings: 0 },
  limitations: ['Maintained CUDA Mamba3 library example source-checked, not executed', 'Isolated prototype production is not shared-site integration', 'Earlier unchanged scientific receipts are reused only with exact raw or explicitly stated LF bindings'],
};
const target = `${folder}/${process.argv.includes('--ready') ? 'reading-flow-ready-sources.json' : process.argv.includes('--reviewed') ? 'reading-flow-reviewed-sources.json' : process.argv.includes('--final-candidate') ? 'reading-flow-final-sources.json' : 'reading-flow-sources.json'}`;
assert(!fs.existsSync(target), 'Never overwrite an accepted or frozen source receipt');
fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ sources: Object.keys(sourceHashes).length, evidence: Object.keys(evidenceHashes).length, checks: receipt.checks, manifestSha256: hash(target) }));
