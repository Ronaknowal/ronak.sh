// Source-bound checks for the scoped connectivity clarification; never replaces older receipts.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const topic = 'src/learn/data/topics/depthwise-separable-dilated-convolutions.jsx';
const original = 'docs/teaching/deep-learning-beginner/original/depthwise-before-connectivity-review/depthwise-separable-dilated-convolutions.jsx';
const body = fs.readFileSync(topic, 'utf8');
const before = fs.readFileSync(original, 'utf8');
const checks = [];
const check = (name, run) => { run(); checks.push(name); };
check('ShuffleNet reshape/transpose rule: four groups of two are not all-to-all', () => {
  const groups = [[0, 1], [2, 3], [4, 5], [6, 7]];
  const permutation = groups[0].flatMap((_, column) => groups.map(row => row[column]));
  assert.deepEqual(permutation, [0, 2, 4, 6, 1, 3, 5, 7]);
  assert.deepEqual(permutation.slice(0, 2).map(channel => Math.floor(channel / 2)), [0, 1]);
  assert.ok(body.includes('0,2,4,6,1,3,5,7'));
  assert.ok(body.includes('shuffling does not always connect each receiving group'));
  assert.ok(body.includes('with unchanged group assignments'));
});
check('One matrix norm definition, with the error bound and interpretation retained', () => {
  assert.equal(body.split('the matrix 2-norm is its largest amplification of a unit-length vector').length - 1, 1);
  assert.ok(body.includes('Here x_c is a flattened patch. The inequality follows'));
});
check('Exactly the two reviewed prose paragraphs changed; all other teaching/code conserved', () => {
  const remove = text => text.split(/\r?\n/).filter(line => !line.startsWith('<Prose>{"Dense and depthwise') && !line.startsWith('<Prose>{"Here x_c')).join('\n');
  assert.equal(remove(body), remove(before));
});
const reused = JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/depthwise-separable-dilated-convolutions/review-fixes-models.json'));
check('Unchanged scientific dependencies still match the previous executed numerical evidence', () => {
  assert.equal(reused.passed, true);
  for (const [file, sha] of Object.entries(reused.sourceHashes || {})) {
    if (file === topic) continue;
    assert.equal(hash(file), sha, file);
  }
});
const receipt = { passed: true, checkedAt: new Date().toISOString(), checks, sourceHashes: { [topic]: hash(topic), [original]: hash(original) }, reusedNumericalEvidence: 'review-fixes-models.json', primarySource: 'https://arxiv.org/html/1707.01083v2#S3.SS1' };
fs.writeFileSync('docs/teaching/deep-learning-beginner/depthwise-separable-dilated-convolutions/connectivity-review-checks.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks: checks.length }));
