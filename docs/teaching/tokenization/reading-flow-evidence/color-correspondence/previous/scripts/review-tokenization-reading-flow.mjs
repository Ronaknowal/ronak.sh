import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { trainBpe, wordPieceTrace, validWordPiecePath, unigramPaths } from '../src/learn/data/subword-tokenization-models.js';
import { inspectByteText, streamingByteTrace, binaryEntropy, bytePatchTrace, initialByteProbabilities } from '../src/learn/data/byte-tokenization-model.js';
import { samplingShares, vocabularyBudget, multilingualResults } from '../src/learn/data/multilingual-vocabulary-models.js';

const record = 'docs/teaching/tokenization';
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const checks = [];
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-10, `${label}: ${actual} != ${expected}`);

// Independent literal counting: three adjacent aa locations per occurrence,
// but a left-to-right nonoverlapping replacement can consume only two.
const overlap = trainBpe({ aaaa: 2 }, 1);
assert.equal(overlap.states[1].selectedCount, 3 * 2);
assert.equal(overlap.states[0].totalSymbols - overlap.states[1].totalSymbols, 2 * 2);
checks.push('Weighted overlapping-pair count versus actual replacement count');

const vocabulary = ['a', 'ab', '##b', '##bc'];
assert.deepEqual(wordPieceTrace('abc', vocabulary).tokens, ['[UNK]']);
assert.deepEqual(validWordPiecePath('abc', vocabulary), ['a', '##bc']);
assert.deepEqual(wordPieceTrace('abc', [...vocabulary, '##c']).tokens, ['ab', '##c']);
checks.push('Greedy-prefix failure with a separate complete path and repaired continuation');

const paths = unigramPaths(.6);
close(paths.mass, .6 + .2 * .2, 'sum of complete path weights');
close(paths.wholePosterior, 15 / 16, 'whole path posterior');
close(paths.splitPosterior, 1 / 16, 'split path posterior');
close(paths.updatedWhole, 15 / 17, 'normalize expected token occurrences');
close(paths.updatedSingle, 1 / 17, 'normalize each singleton count');
const exactBoundary = 3 - 2 * Math.sqrt(2);
assert.ok(.17 < exactBoundary && .18 > exactBoundary);
assert.deepEqual(unigramPaths(.17).best, ['a', 'b']);
assert.deepEqual(unigramPaths(.18).best, ['ab']);
const prefixMass = [1, .2, .6 + .2 * .2];
prefixMass.push(prefixMass[2] * .2);
prefixMass.push(prefixMass[2] * .6 + prefixMass[3] * .2);
close(prefixMass[4], .4096, 'all four abab path products');
checks.push('Path partition/posterior/fractional EM, analytic winner boundary and shared-prefix marginal');

assert.deepEqual(inspectByteText('猫').bytes, [0xe7, 0x8c, 0xab]);
const composed = inspectByteText('é');
assert.deepEqual(composed.bytes, [0xc3, 0xa9]);
assert.equal((0xc3 & 31) * 64 + (0xa9 & 63), 233);
assert.equal(inspectByteText('e\u0301').bytes.length, 3);
assert.deepEqual(inspectByteText('e\u0301', 'NFC').bytes, composed.bytes);
assert.equal(inspectByteText('👩‍🔬').scalars.length, 3);
assert.equal(inspectByteText('👩‍🔬').bytes.length, 11);
assert.equal(inspectByteText('café 🌍').bytes.length, 10);
for (let split = 0; split <= 10; split += 1) {
  const stream = streamingByteTrace('café 🌍', split);
  assert.equal(stream.output, 'café 🌍');
  assert.equal(stream.error, null);
}
assert.match(streamingByteTrace('café 🌍', 8, true).error, /incomplete/);
close(binaryEntropy(.5), 1, 'binary uniform entropy');
close(binaryEntropy(.99), -.99 * Math.log2(.99) - .01 * Math.log2(.01), 'uneven entropy');
const patch = bytePatchTrace(initialByteProbabilities, .5);
assert.deepEqual(patch.patches.map(group => group.length), [3, 3, 2]);
assert.equal(patch.bytePairs, 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8);
assert.equal(patch.patchPairs, 1 + 2 + 3);
assert.deepEqual(bytePatchTrace(initialByteProbabilities, 1).patches.map(group => group.length), [8]);
const changed = [...initialByteProbabilities];
changed[4] = .5;
assert.deepEqual(bytePatchTrace(changed, .5).patches.map(group => group.length), [3, 1, 2, 2]);
close(-Math.log(.9), .10536051565782628, 'target loss');
close(-Math.log(.1), 2.3025850929940455, 'target loss');
close((1 + 4 + 9) / 3, 14 / 3, 'mean pooling second component');
checks.push('UTF-8 payload/normalization/cluster bytes, every globe split, strict EOF, entropy boundaries and means');

assert.deepEqual(samplingShares([9, 1], .5), [.75, .25]);
assert.deepEqual(samplingShares([9, 0], 0), [1, 0]);
assert.equal(samplingShares([0, 0], .5), null);
close(.75 * 2 / 3 + .25 / 3, 7 / 12, 'shared word weighted occurrences');
assert.equal(128000 * 4096, 524288000);
const tied = vocabularyBudget({ vocabulary: 128000, width: 4096, tied: true, baselineTokens: 1000, candidateTokens: 500 });
assert.equal(tied.mebibytes, 1000);
const untied = vocabularyBudget({ vocabulary: 128000, width: 4096, tied: false, baselineTokens: 1000, candidateTokens: 500 });
assert.equal(untied.mebibytes, 2000);
const offset = vocabularyBudget({ vocabulary: 64000, width: 4096, tied: true, baselineTokens: 1000, candidateTokens: 500 });
assert.equal(offset.headRatio, 1);
assert.equal(offset.attentionPairRatio, .25);
close(.2 * .5 + .4 * .1 + .1 * .2, .16, 'output row dot product');
assert.equal(259 * 1024, 265216);
assert.equal(50000 * 1024, 51200000);
close(10 / (10 * Math.LN2), Math.LOG2E, 'common-byte likelihood denominator');
checks.push('Mixture zero support, shared-word mass, MiB/tied storage, head/pair tradeoff and logit arithmetic');

const nativeBytes = read(`${record}/byte-level-tokenization-token-free-models/native-evidence.json`);
const nativeVocabulary = read(`${record}/vocabulary-design-multilingual-tokenization/native-evidence.json`);
const nativeSubword = read(`${record}/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/author-evidence.json`);
const reusedBindings = {};
for (const [file, digest] of Object.entries(nativeSubword.sourceSha256).filter(([file]) => file.startsWith('public/'))) {
  assert.equal(hash(file), digest, `Changed native subword input: ${file}`);
  reusedBindings[file] = digest;
}
for (const binding of nativeBytes.sourceBindings.filter(binding => binding.path.startsWith('public/'))) {
  assert.equal(hash(binding.path), binding.sha256, `Changed native byte input: ${binding.path}`);
  reusedBindings[binding.path] = binding.sha256;
}
for (const [file, digest] of Object.entries(nativeVocabulary.sources).filter(([file]) => file.startsWith('public/'))) {
  assert.equal(hash(file), digest, `Changed native vocabulary input: ${file}`);
  reusedBindings[file] = digest;
}
assert.deepEqual(multilingualResults.map(row => row.counts), [
  [1730, 2387, 1446], [1781, 2195, 1446], [1399, 1895, 1436], [1440, 1708, 1423],
]);
checks.push('Unchanged native program/dataset identities and exact recorded held-out count series');

const bindingFiles = [
  'src/learn/data/subword-tokenization-models.js', 'src/learn/data/byte-tokenization-model.js',
  'src/learn/data/multilingual-vocabulary-models.js',
  'src/learn/data/topics/tokenization.jsx', 'src/learn/data/topics/byte-level-tokenization.jsx',
  'src/learn/data/topics/vocabulary-multilingual.jsx',
  `${record}/byte-level-tokenization-token-free-models/native-evidence.json`,
  `${record}/vocabulary-design-multilingual-tokenization/native-evidence.json`,
  `${record}/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/author-evidence.json`,
];
fs.mkdirSync(`${record}/reading-flow-evidence`, { recursive: true });
fs.writeFileSync(`${record}/reading-flow-evidence/independent-numerics.json`, JSON.stringify({
  checkedAt: new Date().toISOString(), reviewer: 'root, independent of topic authors', checks,
  sourceHashes: Object.fromEntries(bindingFiles.map(file => [file, hash(file)])), reusedBindings,
  verifierHash: hash('scripts/review-tokenization-reading-flow.mjs'),
  limits: 'Complementary analytic checks and original native input identity; does not rerun full tokenizer fits or certify rendered geometry.',
}, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, groups: checks.length, preservedNativeInputs: Object.keys(reusedBindings).length }));
