import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const topic = 'dapo-dynamic-adaptive-policy-optimization';
const folder = `docs/teaching/llm-architecture-training/${topic}`;
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const input = `${folder}/runtime-inputs.json`;
assert.equal(sha(input), '09137196bbfebb5a510331195c64651dabb2fdce09a6d14c8a786e2360c900c8');
const packet = JSON.parse(fs.readFileSync(input));
const files = { ...packet.files };
assert.equal(Object.keys(files).length, 2685);
for (const [p, h] of Object.entries(files)) assert.equal(sha(p), h, p);
for (const name of ['runtime-inputs.json', 'runtime-review.md', 'runtime-independent-preparation/source-observations.md', 'runtime-independent-preparation/final-model-checks.json', 'runtime-independent-preparation/evidence-checks.json', 'runtime-independent-browser/report.json', 'runtime-independent-browser/recovery-closure.json']) files[`${folder}/${name}`] = sha(`${folder}/${name}`);
for (const name of fs.readdirSync(`${folder}/runtime-independent-browser`).filter(p => p.endsWith('.png'))) files[`${folder}/runtime-independent-browser/${name}`] = sha(`${folder}/runtime-independent-browser/${name}`);
for (const p of ['scripts/accept-dapo-runtime.mjs', 'scripts/review-dapo-runtime-models.mjs', 'scripts/review-dapo-runtime-evidence.mjs', 'scripts/review-dapo-runtime-browser.cjs', 'scripts/review-dapo-runtime-recovery.cjs']) files[p] = sha(p);
const model = JSON.parse(fs.readFileSync(`${folder}/runtime-independent-preparation/final-model-checks.json`));
assert.equal(model.passed, true); assert.equal(model.conditions, 752);
for (const [p, h] of Object.entries(model.source)) assert.equal(sha(p), h, p);
const evidence = JSON.parse(fs.readFileSync(`${folder}/runtime-independent-preparation/evidence-checks.json`));
assert.equal(evidence.passed, true); assert.equal(evidence.count, 2465);
for (const [p, h] of Object.entries(evidence.files)) assert.equal(sha(p), h, p);
const broad = JSON.parse(fs.readFileSync(`${folder}/paint-report-1791447370253/index.json`));
for (const [p, h] of Object.entries(broad.before)) {
  assert.equal(broad.after[p], h, `Broad capture source changed: ${p}`);
  if (sha(p) !== h) {
    const name = p.split('/').at(-1);
    assert.equal(sha(`${folder}/runtime-paint-correction/${name}.before`), h, `Missing bounded predecessor: ${p}`);
  }
}
const focused = JSON.parse(fs.readFileSync(`${folder}/paint-correction-1791448610898/index.json`));
assert.equal(focused.status, 'passed'); assert.equal(focused.checks.length, 50);
const compass = JSON.parse(fs.readFileSync(`${folder}/paint-compass-1791448816609/index.json`));
assert.equal(compass.status, 'passed'); assert.equal(compass.checks.length, 3);
for (const [p, h] of Object.entries(compass.before)) { assert.equal(compass.after[p], h, p); assert.equal(sha(p), h, p); }
assert.equal(JSON.parse(fs.readFileSync(`${folder}/runtime-independent-browser/recovery-closure.json`)).status, 'passed');
fs.writeFileSync(`${folder}/runtime-acceptance.json`, JSON.stringify({ at: new Date().toISOString(), accepted: true, reviewer: 'root; different whole runtime, actual paint and same-reviewer bounded corrections', phase: 'ready-for-production-integration', topic, manuscript: `${folder}/lesson.jsx`, figures: '[data-dapo-figure]', count: 36, assets: 'learn-code/dapo', assetFiles: ['learn-code/dapo-examples.zip'], files, limits: 'No scientific replay. Native individual program downloads and archive HTTP bytes verified; native archive download event unverified. Normal production integration follows.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ accepted: true, bindings: Object.keys(files).length }));
