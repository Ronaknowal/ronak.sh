import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const id = 'multimodal-pre-training-vision-encoders-cross-modal-alignment';
const folder = `docs/teaching/llm-architecture-training/${id}`;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const entry = read('docs/teaching/lesson-delivery-progress.json').topics[id];
assert.equal(entry.content.status, 'complete');
for (const [file, expected] of Object.entries(entry.content.files)) assert.equal(hash(file), expected, file);
assert.equal(hash(`${folder}/runtime-review.md`), 'e5a63810f3c1e59a474c20bf113212cd29afa0688467abaad6b2e06d239df1ce');
assert.equal(hash(`${folder}/runtime-formatting/independent-review.md`), '74aedfe5cc548112fe3ee500ea08709df870b7118c09bad3e31979c63e209f73');
const changes = new Map(read(`${folder}/runtime-formatting/equivalence.json`).changes.map(change => [change.file, change]));
const files = { ...entry.content.files };
for (const input of read(`${folder}/runtime-inputs.json`).files) {
  const change = changes.get(input.path);
  if (change) {
    assert.equal(input.sha256, change.before);
    assert.equal(hash(change.predecessor), input.sha256);
    assert.equal(hash(input.path), change.after);
  } else assert.equal(hash(input.path), input.sha256, input.path);
  files[input.path] = hash(input.path);
}
for (const name of ['runtime-review.md', 'runtime-inputs.json', 'runtime-review-probes.json', 'browser-different-review/report.json', 'runtime-formatting/independent-review.md', 'runtime-formatting/independent-equivalence.json', 'runtime-formatting/equivalence.json']) {
  const file = `${folder}/${name}`;
  if (fs.existsSync(file)) files[file] = hash(file);
}
for (const name of fs.readdirSync(`${folder}/runtime-formatting`)) {
  const file = `${folder}/runtime-formatting/${name}`;
  files[file] = hash(file);
}
for (const name of ['LessonFlow.jsx', 'lesson-flow.css', 'LessonElements.jsx']) {
  const file = `src/learn/components/lesson-labs/${name}`;
  files[file] = hash(file);
}
for (const name of ['RemoteCodeBlock.jsx', 'Headings.jsx', 'Math.jsx']) {
  const file = `src/learn/components/content/${name}`;
  files[file] = hash(file);
}
fs.writeFileSync(`${folder}/runtime-acceptance.json`, JSON.stringify({
  at: new Date().toISOString(), accepted: true, reviewer: 'root', topic: id,
  phase: 'ready-for-production-integration', manuscript: entry.content.manuscript,
  figures: '[data-mmp-figure]', count: 25, assets: 'learn-code/multimodal-pretraining', files,
  review: `${folder}/runtime-review.md`,
  basis: 'Entire independent source/numerical/actual-paint review accepted; two formatting successors retain exact JSX computation and rendered text through separate independent equivalence review. All159 submitted inputs guarded with only those two exact successors. Original scientific/content inputs conserved; no repeat fits. Production integration follows.',
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ accepted: true, inputs: Object.keys(files).length }));
