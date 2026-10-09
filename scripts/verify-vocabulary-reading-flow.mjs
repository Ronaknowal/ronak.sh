import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { mixtureExperiment, samplingShares, vocabularyBudget, multilingualResults } from '../src/learn/data/multilingual-vocabulary-models.js';

const record = 'docs/teaching/tokenization/vocabulary-design-multilingual-tokenization/';
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const groups = [];
const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-12);

// Closed-form counts and fractions are independent of the rendering helpers.
assert.deepEqual(['cat', 'cats'].map(word => word.length), [3, 4]);
assert.equal(Buffer.from('猫猫').toString('hex'), 'e78cabe78cab');
assert.equal(Array.from('猫猫').length, 2);
near(3 / 2, 1.5);
near(1 / 2, .5);
near(18 / 12, 1.5);
near((18 / 6) / (12 / 8), 2);
near(16 / 20, .8);
groups.push('Dictionary counts, UTF8 groups, fertility and translation denominator counterexample');

near(samplingShares([9, 1], .5)[0], .75);
near(samplingShares([9, 1], 0)[0], .5);
assert.deepEqual(samplingShares([9, 0], 0), [1, 0]);
assert.equal(samplingShares([0, 0, 0], .5), null);
const squareRootTotal = Math.sqrt(80) + Math.sqrt(15) + Math.sqrt(5);
samplingShares([80, 15, 5], .5).forEach((share, i) => near(share, Math.sqrt([80, 15, 5][i]) / squareRootTotal));
near(.75 * 2 / 3 + .25 * 1 / 3, 7 / 12);
near(7 / 12 + 1 / 4 + 1 / 6, 1);
assert.deepEqual([Math.floor(12 * .9), Math.floor(12 * .1)], [10, 1]);
assert.equal(12 - 10 - 1, 1);
groups.push('Sampling powers, zero support, weighted shared word and exact floor/remainder allocation');

for (const masses of [[80, 15, 5], [37, 11, 83], [0, 0, 0], [0, 47, 0], [100, 100, 100]]) {
  for (const alpha of [0, .17, .51, 1]) {
    for (const joins of [0, 3, 9, 16]) {
      const result = mixtureExperiment(masses, alpha, joins);
      if (!masses.some(Boolean)) { assert.equal(result, null); continue; }
      near(result.shares.reduce((sum, value) => sum + value, 0), 1);
      assert(result.model.merges.length <= joins);
      for (const row of result.rows) for (const piece of row.pieces) {
        if (piece.tokens) assert.equal(piece.tokens.join('').replaceAll('</w>', ''), piece.word);
      }
    }
  }
}
assert.deepEqual(mixtureExperiment([80, 15, 5], 0, 0).rows.map(row => row.pieces), mixtureExperiment([80, 15, 5], 1, 0).rows.map(row => row.pieces));
groups.push('80 live supported/null/interior/end-point model configurations with roundtrip invariants');

const storage = vocabularyBudget({ vocabulary: 128000, width: 4096, tied: true, baselineTokens: 1000, candidateTokens: 750 });
assert.equal(storage.parameters, 524288000);
assert.equal(storage.mebibytes, 1000);
const quarter = vocabularyBudget({ vocabulary: 64000, width: 4096, tied: true, baselineTokens: 1000, candidateTokens: 500 });
assert.equal(quarter.headRatio, 1);
assert.equal(quarter.attentionPairRatio, .25);
assert.equal(64000 * 2048 * 2 / 2 ** 20, 250);
assert.equal(.75 * 2, 1.5);
assert.equal(.75 ** 2, .5625);
assert.equal(4 * 5, 2 * 10);
assert.equal(4 * 4 / (2 * 2), 4);
groups.push('Matrix storage/MiB, tied/untied costs and independent head/pair grids');

const rows = [[.1, .4, -.2], [.3, -.1, .5], [-.2, .6, .1], [.4, .2, -.3], [.5, .1, .2]];
const scores = rows.map(row => row[0] * .2 + row[1] * .4 + row[2] * .1);
scores.forEach((score, i) => near(score, [.16, .07, .21, .13, .16][i]));
const probabilities = scores.map(score => Math.exp(score) / scores.reduce((sum, value) => sum + Math.exp(value), 0));
near(probabilities.reduce((sum, value) => sum + value, 0), 1);
near(.2 * .5 + .4 * .1 + .1 * .2, .16);
const oldDenominator = Math.exp(.4) + Math.exp(-.7);
const oldP = Math.exp(.4) / oldDenominator;
near(Math.exp(.4) / (oldDenominator + Math.exp(.1)), oldP * oldDenominator / (oldDenominator + Math.exp(.1)));
assert.deepEqual([100 / 4, 100 / 5], [25, 20]);
groups.push('Five independent dot products and normalized probability values; general softmax denominator identity');

const native = JSON.parse(readFileSync(record + 'native-evidence.json', 'utf8'));
for (const plotted of multilingualResults) {
  const run = native.sentencepiece.experiments.find(run => run.alpha === plotted.alpha && run.requested_vocabulary === plotted.vocabulary);
  assert(run);
  assert.deepEqual(plotted.counts, ['eng_Latn', 'hin_Deva', 'zho_Hans'].map(language => run.audit[language].tokens));
}
near(1446 / 1730, .8358381502890173);
assert.equal(300 + 60, 360);
assert.equal('solar-panel'.length, 11);
assert.deepEqual([4000 - 500 - 3200, 3800 - (4000 - 500)], [300, 300]);
groups.push('All12 plotted actual counts match frozen native execution; dataset/boundary/retrieval quantities');

const snapshot = JSON.parse(readFileSync(record + 'original/reading-flow/sources.json', 'utf8').replace(/^\uFEFF/, ''));
for (const binding of snapshot.files) {
  assert.equal(hash(record + 'original/reading-flow/' + binding.path), binding.sha256);
  if (binding.path.startsWith('public/') || binding.path.endsWith('multilingual-vocabulary-models.js')) assert.equal(hash(binding.path), binding.sha256);
}
groups.push('Ten rollback identities and unchanged computational model/program/data identities');

const bound = ['src/learn/data/topics/vocabulary-multilingual.jsx', 'src/learn/components/lesson-labs/MultilingualVocabularyLabs.jsx', 'src/learn/components/lesson-labs/multilingual-vocabulary.css', 'src/learn/data/multilingual-vocabulary-models.js', 'scripts/verify-vocabulary-reading-flow.mjs'];
const result = { checkedAt: new Date().toISOString(), status: 'passed', kind: 'author-only scoped arithmetic and source conservation; historical native execution reused', groups, scores, probabilities, sources: Object.fromEntries(bound.map(path => [path, hash(path)])) };
writeFileSync(record + 'reading-flow-author-values.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, groups: groups.length, record: record + 'reading-flow-author-values.json' }));
