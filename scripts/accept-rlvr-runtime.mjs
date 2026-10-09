import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const topic = 'rlvr-reinforcement-learning-with-verifiable-rewards';
const folder = `docs/teaching/llm-architecture-training/${topic}`;
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const input = `${folder}/runtime-inputs.json`;
const reviewInput = `${folder}/runtime-review-inputs.json`;
assert.equal(sha(input), 'b3ddacfecc0ab537393bdd5fab16111b696f865b1593a00236e7cf1fdf09c4bb');
assert.equal(sha(reviewInput), 'adff201531d989dca8fa24defe13551b705ca18e74d58a7929c817e131d413fd');
const author = JSON.parse(fs.readFileSync(input));
const review = JSON.parse(fs.readFileSync(reviewInput));
assert.equal(author.bindings.length, 1278);
assert.equal(review.files.length, 1499);
assert.equal(review.whole_runtime_different_review, true);
assert.equal(review.author_manifest_sha256, sha(input));
assert.deepEqual(review.open_material_findings, []);
assert.equal(review.coverage.defaults.objects, 117);
assert.equal(review.coverage.additional.objects, 173);
assert.deepEqual(review.coverage.defaults.missing_read_tiles, []);
assert.deepEqual(review.coverage.additional.missing_read_tiles, []);
const files = {};
function bind(p, h) {
  assert.equal(sha(p), h, p);
  const normalized = p.replaceAll('\\', '/');
  if (Object.hasOwn(files, normalized)) assert.equal(files[normalized], h, normalized);
  files[normalized] = h;
}
for (const item of [...author.bindings, ...review.files]) bind(item.path, item.sha256);
for (const [p, h] of Object.entries(review.current_source_hashes)) bind(p, h);
for (const name of ['runtime-inputs.json', 'runtime-review-inputs.json', 'runtime-review.md', 'runtime-author-ready.json', 'runtime-author-review.md']) {
  const p = `${folder}/${name}`; bind(p, sha(p));
}
for (const p of ['scripts/accept-rlvr-runtime.mjs', 'scripts/review-rlvr-epoch-control.cjs', 'scripts/attribute-rlvr-network.cjs', 'scripts/check-rlvr-viewport-capture.cjs', 'scripts/lib/rlvr-browser-capture.cjs']) bind(p, sha(p));
fs.writeFileSync(`${folder}/runtime-acceptance.json`, JSON.stringify({
  at: new Date().toISOString(), accepted: true,
  reviewer: 'root; composed different whole content/runtime/source/paint recommendation and source-bound complementary diagnostics',
  phase: 'ready-for-production-integration', topic, manuscript: `${folder}/lesson.jsx`,
  figures: '[data-rlvr-figure]', count: 39, assets: 'learn/examples/rlvr',
  assetRoots: ['learn/examples/rlvr', 'learn-assets/rlvr'], files,
  qualifications: [...new Set([...author.qualifications, ...review.qualifications])],
  limits: 'No scientific replay. Current exact bindings accepted; unavailable historical receipt bytes are not recertified. Native individual downloads and HTTP archive bytes verified; native ZIP save remains unverified. Normal production integration follows.'
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ accepted: true, bindings: Object.keys(files).length }));
