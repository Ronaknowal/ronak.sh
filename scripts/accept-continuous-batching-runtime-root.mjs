import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const b = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p));
const p = `${b}/runtime-root-correction/inputs.json`;
assert.equal(sha(p), 'f87ab2e186e874f421aedb4abe8c15a5abc51bbc329e471b7167938a45147584');
const packet = read(p), files = {};
for (const row of packet.files) { assert.equal(sha(row.path), row.sha256, row.path); files[row.path] = row.sha256; }
const original = `${b}/runtime-inputs.json`;
assert.equal(sha(original), '5f6eeab2fb9a4a394b8144ef53a404bb200a21372bf4f0b583637ca9d69bcbb1');
const previous = read(`${b}/runtime-root-correction/predecessor.json`);
for (const row of read(original).files) {
  const retained = previous.find(x => x.path === row.path);
  assert.equal(sha(retained?.preserved ?? row.path), row.sha256, row.path);
}
assert.ok(read(`${b}/runtime-root-correction/ast-checks.json`).results.every(x => x.outsideFunctionAstEqual));
const review = `${b}/runtime-review-root/closure.md`;
fs.writeFileSync(review, `# SAME runtime review closure\n\nRoot, 9 October 2026. Accepted for normal integration.\n\nThis closes both findings in the preserved different whole runtime review. Root read the complete corrected CbBudgets and CbChunks functions and author correction report, and personally read all 40 native-size atlases (80 tiles) from browser-root-correction-1791491467290. Atlas21–25 were reopened after a truncated tool response; no failed display counts as reading. This includes all21 primary default/changed/reset objects and31 actual pans at desktop, phone390 and enlarged768/root32.\n\nD05 now distinguishes the four resident pages from D's conditional proposed page, and preserves C's unscheduled resident cache. Two queries require four pages at both capacity4 and capacity5. D20 has six distinct numbered colour identities, query/key axes, chunk brackets and matching accounting rows. Two-, four- and twelve-row cases retain exactly78 permitted pairs. Wide structures remain locally keyboard-scrollable, with readable continuation and end positions. No material finding remains.\n\nRoot also personally read the final refreshed D30 desktop default, extra-page and nonbinding-slot paintings from browser-label-closure-1791490872411. The neutral candidate caption agrees with both waiting and eligible states. These replace the predecessor caption in Root's original campaign. Other phone/enlarged D30 reading remains explicitly attributed to the author's complete review.\n\nAll3163 successor bindings and all2981 original bindings were checked, with the two changed predecessor components preserved. The bounded AST check conserves every other top-level function. This composes the original whole source and all95 Root paint-tile review, accepted complete content review and author's complete responsive/control/delivery checks. Scientific results were not rerun; native ZIP cancellation, historical stale preview evidence and all measurement limits remain explicit. Normal production integration is separate.\n`, { flag: 'wx' });
for (const f of [p, original, review, `${b}/runtime-review-root/review.md`]) files[f] = sha(f);
const manuscript = `${b}/lesson.jsx`;
const published = fs.readFileSync(manuscript, 'utf8').replaceAll('../../../../src/learn/', '../../');
fs.writeFileSync(`${b}/runtime-acceptance.json`, JSON.stringify({ accepted: true, topicId: 'continuous-batching-pagedattention', reviewer: '/root', author: '/root/training_author', status: 'private-runtime-accepted-production-pending', manuscript, review, authorReview: `${b}/runtime-author-review.md`, files, publishedSha256: createHash('sha256').update(published).digest('hex'), figures: '[data-cb-figure]', count: 30, assets: 'public/learn-code/continuous-batching', assetRoots: ['public/learn-code/continuous-batching', 'public/learn-assets/continuous-batching-pagedattention'] }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ accepted: true, successorGuards: packet.files.length, predecessorGuards: read(original).files.length }));
