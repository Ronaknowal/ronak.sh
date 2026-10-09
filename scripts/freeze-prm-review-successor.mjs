import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const owner = 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm';
const output = `${owner}/runtime-review-successor`;
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record = (file) => ({ path: file, sha256: hash(file) });
const profiles = ['desktop', 'phone', 'enlarged'];
const defaults = [];
for (const profile of profiles) {
  for (let n = 1; n <= 29; n++) {
    const id = `D${String(n).padStart(2, '0')}`;
    const paths = n === 13
      ? [0, 850, ...(profile === 'enlarged' ? [1700] : [])].map((offset) => `${output}/checkpoint-paint/${profile}-D13-${offset}.png`)
      : [n === 22 ? `${output}/compact-tree/screenshots/${profile}-D22-1-2.png`
        : n === 23 ? `${output}/compact-tree/screenshots/${profile}-D23-step8.png`
          : `${output}/browser/screenshots/${profile}-${id}.png`];
    defaults.push({ profile, id, images: paths.map(record), binding: n === 13 || n === 22 || n === 23 ? 'final component' : 'intermediate component; unchanged named declaration and identical CSS' });
  }
}
assert.equal(defaults.length, 87);
const changed = [];
for (const folder of ['browser/screenshots', 'compact-tree/screenshots']) {
  for (const name of fs.readdirSync(`${output}/${folder}`).filter((name) => name.endsWith('.png'))) {
    if (folder.startsWith('browser') && /-D(22|23)(?:-|\.)/.test(name)) continue;
    if (defaults.some((item) => item.images.some((image) => image.path.endsWith('/' + name)))) continue;
    if (/-(?:D\d\d)\.png$/.test(name)) continue;
    changed.push(record(`${output}/${folder}/${name}`));
  }
}
fs.writeFileSync(`${output}/paint-index.json`, JSON.stringify({
  author_inspected: true,
  profiles: { desktop: '1366px; root 16px', phone: '390px; root 16px', enlarged: '768px; root 32px' },
  defaults,
  changed,
  inspection: 'All 59 contact sheets and seven current D13 viewport tiles personally read; final desktop D22/D23 also inspected individually.',
  diagnostics: [{ ...record(`${output}/browser/screenshots/desktop-D13.png`), reason: 'Defective tall-element crop; superseded by native viewport tiles, not accepted paint.' }],
  predecessors: 'Earlier wide-tree D22/D23 captures remain in the execution report; final compact-tree images above supersede them.'
}, null, 2) + '\n');

const predecessor = JSON.parse(fs.readFileSync(`${owner}/runtime-inputs.json`));
const files = Object.fromEntries(Object.keys(predecessor.files).map((file) => [file, hash(file)]));
const addTree = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) addTree(file);
    else if (entry.name !== 'inputs.json') files[file] = hash(file);
  }
};
addTree(output);
for (const file of [
  `${owner}/runtime-inputs.json`, `${owner}/runtime-review.md`,
  'scripts/check-prm-review-conservation.mjs',
  'scripts/verify-prm-review-successor.cjs',
  'scripts/verify-prm-review-tree-compact.cjs',
  'scripts/verify-prm-review-checkpoint-paint.cjs',
  'scripts/freeze-prm-review-successor.mjs',
]) files[file] = hash(file);
const conservation = JSON.parse(fs.readFileSync(`${output}/conservation.json`));
assert.equal(conservation.conservedRuntimeInputs, 1120);
const result = {
  stage: 'Bounded R1–R6 author successor ready for same-reviewer closure',
  author: 'multimodal_reviewer', fits: 0,
  predecessor: record(`${owner}/runtime-inputs.json`),
  reviewer: record(`${owner}/runtime-review.md`),
  application_delta: conservation.delta,
  conserved_runtime_bindings: 1120,
  conserved_accepted_content_bindings: 123,
  files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
};
fs.writeFileSync(`${output}/inputs.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ inputs: hash(`${output}/inputs.json`), files: Object.keys(files).length, defaults: defaults.length, changed: changed.length, component: hash('src/learn/components/lesson-labs/PRMFlow.jsx'), css: hash('src/learn/components/lesson-labs/prm-flow.css'), author: hash(`${output}/author-review.md`) }));
