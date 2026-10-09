// Checks the values and flow repairs made in the 4 October 2026 independent review of the
// Depthwise Separable & Dilated Convolutions lesson. Writes only its own review receipt.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const lesson = 'src/learn/data/topics/depthwise-separable-dilated-convolutions.jsx';
const figures = 'src/learn/components/lesson-labs/DepthwiseFlowFigures.jsx';
const receipt = 'docs/teaching/deep-learning-beginner/depthwise-separable-dilated-convolutions/review-fixes-checks.json';
const body = fs.readFileSync(lesson, 'utf8');
const figureSource = fs.readFileSync(figures, 'utf8');
const checks = [];
const check = (name, work) => { work(); checks.push(name); };

check('Hard-swish(−2) is −1/3 in prose and figure caption', () => {
  const hswish = x => x * Math.min(6, Math.max(0, x + 3)) / 6;
  assert.ok(Math.abs(hswish(-2) + 1 / 3) < 1e-12);
  assert.ok(body.includes('= −1/3') && !body.includes('−2/3'));
  assert.ok(/h\(−2\) ?= ?−1\/3/.test(figureSource) && !figureSource.includes('−2/3'));
});

check('Grouped-convolution and intensity numbers', () => {
  assert.equal(9 * 64 * 128 / 4, 18432);
  assert.equal(9 * 64, 576);
  assert.ok(body.includes('18,432 of the 73,728') && body.includes('9\\\\times64=576'));
});

check('Interval join: rate 3 joins and rate 4 skips ±2 when S = 1', () => {
  const join = (S, d) => d - S <= S + 1;
  assert.ok(join(1, 3) && !join(1, 4));
  const reach = d => new Set([-d, 0, d].flatMap(shift => [-1, 0, 1].map(v => v + shift)));
  assert.equal(reach(3).size, 9);
  assert.ok(!reach(4).has(2) && !reach(4).has(-2));
});

// Drawings revision: folding is taught with a drawing in the Convolution lesson, so this lesson
// refers back to it before the general equation and adds only the separable-pair rule.
check('BatchNorm folding refers back to the Convolution drawing before the general equation', () => {
  const back = body.indexOf('Convolution lesson’s folding drawing');
  const general = body.indexOf("W'=\\\\frac{\\\\gamma W}");
  const separable = body.indexOf('For a separable pair, fold each BatchNorm');
  assert.ok(back > 0 && back < general && general < separable);
  assert.ok(!body.includes('data-figure="batchnorm-folding"'));
});

check('Singleton BatchNorm caution sits after the image-summary branch is taught', () => {
  const caution = body.indexOf('training-mode BatchNorm cannot estimate a channel variance from one value');
  const aspp = body.indexOf('atrous spatial pyramid pooling');
  assert.ok(caution > aspp && aspp > 0);
});

check('Coverage lab precedes its general rule', () => {
  assert.ok(body.indexOf('<DepthwiseCoverageLab />') < body.indexOf('The rows follow one general rule'));
});

check('No duplicated definitions, author jargon, glued numbers or heading-copied captions', () => {
  for (const phrase of ['supplied author calculations', 'Matrix Decompositions owner', 'secretly responsible', 'The improved ', 'This topic owns',
    'For one spatial axis, input length', 'Suppose incoming features have receptive-field', 'Compare the three shifted copies before using',
    'A scalar construction makes the information argument', 'Can a trained standard convolution be replaced', 'learn-code/depthwise-separable-dilated-convolutions/../']) {
    assert.ok(!body.includes(phrase), phrase);
  }
  assert.ok(!/rank[12]\b|A0\.1|ranks1|multiplier2/.test(body));
  const headings = [...body.matchAll(/<H[23]>\{"([^"]+)"\}<\/H[23]>/g)].map(match => match[1]);
  const captions = [...body.matchAll(/caption=\{"([^"]+)"\}/g)].map(match => match[1]);
  assert.equal(captions.length, 5); // the sign table became a drawing in the drawings revision
  for (const caption of captions) assert.ok(!headings.includes(caption), caption);
  assert.equal(new Set(captions).size, captions.length);
});

const report = { passed: true, checkedAt: new Date().toISOString(), checks, sourceHashes: {} };
for (const file of [lesson, figures]) report.sourceHashes[file] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.writeFileSync(receipt, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, checks: checks.length }));
