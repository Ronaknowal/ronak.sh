import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const id = 'rl-for-reasoning-deepseek-r1-style';
const folder = `docs/teaching/llm-architecture-training/${id}`;
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const acceptance = `${folder}/content-review-acceptance.json`;
assert.equal(sha(acceptance), '8abd337fa4fb23b15320fc784b56f93eedd21f69234beefe3c343078c51551ee');
const review = JSON.parse(fs.readFileSync(acceptance));
assert.equal(review.status, 'accepted-different-whole-content-review');
assert.equal(review.author, 'root');
assert.equal(review.reviewer, 'alignment_author');
assert.equal(Object.keys(review.inputs).length, 93);
const files = { ...review.inputs, [acceptance]: sha(acceptance) };
for (const [file, digest] of Object.entries(files)) assert.equal(sha(file), digest, file);
const manifest = `${folder}/content-root-inputs.json`;
fs.writeFileSync(manifest, JSON.stringify({
  status: 'accepted-content-with-different-whole-review',
  author: 'root', reviewer: 'alignment_author', acceptedAt: new Date().toISOString(),
  basis: 'Root read the entire different review; all 89 original inputs and 93 review inputs remain exact. The different reviewer records complete manuscript/program/specification reading and 106768 complementary conditions with zero fits, updates or neural generation. Runtime and normal integration remain pending.',
  files,
}, null, 2) + '\n', { flag: 'wx' });
execFileSync(process.execPath, ['scripts/checkpoint-llm-pretraining-content.mjs', id,
  'lesson.md', 'rl-reasoning', '7c0fd96469440fc5e5659c928216b133c637e80beefaf1d5dcdb4a2af49deb7b',
  manifest, sha(manifest)], { stdio: 'inherit' });
