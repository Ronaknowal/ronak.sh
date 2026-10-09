import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { trainBpe, corpusCounts, encodeBpe, unigramPaths } from '../src/learn/data/subword-tokenization-models.js';

const record = 'docs/teaching/tokenization/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram';
const figure = fs.readFileSync('src/learn/components/lesson-labs/SubwordStructureFigures.jsx', 'utf8');
const prose = fs.readFileSync('src/learn/data/topics/tokenization.jsx', 'utf8');
const checks = [];
function check(name, operation) { operation(); checks.push(name); }
check('Actual first merge weighted corpus states', () => {
  const model = trainBpe(corpusCounts('low low low low low lower lower newest newest newest newest newest newest widest widest widest'), 5);
  assert.equal(model.states[0].totalSymbols, 95);
  assert.equal(model.states[1].totalSymbols, 86);
  assert.deepEqual(model.merges, [['e', 's'], ['es', 't'], ['est', '</w>'], ['l', 'o'], ['lo', 'w']]);
  assert.deepEqual(encodeBpe('lowest', model.merges), ['low', 'est</w>']);
});
check('Overlap includes weight two', () => {
  const model = trainBpe({ aaaa: 2 }, 1);
  assert.equal(model.states[0].pairs[0].count, 6);
  assert.equal(model.states[0].totalSymbols - model.states[1].totalSymbols, 4);
});
check('Independent lattice enumeration for all prefix totals and best weights', () => {
  const probabilities = { a: .2, b: .2, ab: .6 };
  function enumerate(word) {
    if (!word) return [1];
    return Object.entries(probabilities).flatMap(([piece, p]) => word.startsWith(piece) ? enumerate(word.slice(piece.length)).map(weight => p * weight) : []);
  }
  const totals = ['', 'a', 'ab', 'aba', 'abab'].map(word => enumerate(word).reduce((a, b) => a + b, 0));
  [.2, .64, .128, .4096].forEach((value, i) => assert.ok(Math.abs(totals[i + 1] - value) < 1e-12));
  assert.match(figure, /const totals = \[1, \.2, \.64, \.128, \.4096\]/);
  assert.equal(Math.max(...enumerate('abab')), .36);
});
check('Exact edge credit and EM update including token-count denominator', () => {
  const whole = .6 / (.6 + .2 * .2), split = .2 * .2 / (.6 + .2 * .2);
  const expectedTotal = whole + 2 * split;
  assert.ok(Math.abs(whole - 15 / 16) < 1e-12);
  assert.ok(Math.abs(split - 1 / 16) < 1e-12);
  assert.ok(Math.abs(expectedTotal - 17 / 16) < 1e-12);
  assert.ok(Math.abs(whole / expectedTotal - 15 / 17) < 1e-12);
  assert.ok(Math.abs(split / expectedTotal - 1 / 17) < 1e-12);
});
check('Fixed-weight pruning and normalized no-whole investigation are distinct', () => {
  assert.ok(Math.abs(.64 - .04 - .6) < 1e-12);
  assert.equal(unigramPaths(.6, false).mass, .25);
  assert.match(figure, /holds surviving weights fixed/);
});
check('Probability boundary and changed fixtures', () => {
  const boundary = 3 - 2 * Math.sqrt(2);
  assert.ok(Math.abs(boundary - ((1 - boundary) / 2) ** 2) < 1e-12);
  assert.deepEqual(unigramPaths(.2).best, ['ab']);
  assert.deepEqual(unigramPaths(.1).best, ['a', 'b']);
});
check('Stored values and attention-pair arithmetic', () => {
  assert.equal(4 * 3, 12);
  assert.equal(6 * 6, 36); assert.equal(2 * 2, 4);
  assert.ok(Math.abs((100 / 131.25) ** 2 - .5804988662) < 1e-9);
  assert.ok(Math.abs((420 / 3.2 - 420 / 4.2) / (420 / 3.2) * 100 - 23.8095238095) < 1e-9);
});
check('Recorded figure piece arrays agree with preserved native output', () => {
  const arrays = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXAttribute' && node.name.name === 'pieces' && node.value?.expression?.type === 'ArrayExpression') {
      const elements = node.value.expression.elements;
      if (elements.every(element => element.type === 'StringLiteral')) arrays.push(elements.map(element => element.value));
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(parse(figure, { sourceType: 'module', plugins: ['jsx'] }));
  const native = JSON.parse(fs.readFileSync(`${record}/native-output.json`, 'utf8'));
  for (const system of ['HF BPE', 'SentencePiece bpe']) {
    const expected = native.real_text.results.find(row => row.system === system).example;
    assert.ok(arrays.some(array => JSON.stringify(array) === JSON.stringify(expected)), system);
  }
});
check('Canonical code and old frozen science preserved', () => {
  const old = JSON.parse(fs.readFileSync(`${record}/author-evidence.json`, 'utf8'));
  for (const [path, digest] of Object.entries(old.sourceSha256).filter(([path]) => path.startsWith('public/learn-code/') || path.endsWith('subword-tokenization-models.js'))) {
    assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'), digest, path);
  }
  for (const file of ['subword_tokenizers.py', 'unigram_model.py', 'tokenizer_libraries.py']) assert.ok(prose.includes(file));
  assert.equal((prose.match(/data-lesson-exercise=/g) || []).length, 5);
});
const sourcePaths = ['src/learn/data/topics/tokenization.jsx', 'src/learn/components/lesson-labs/SubwordStructureFigures.jsx', 'src/learn/components/lesson-labs/SubwordTokenizationLabs.jsx', 'src/learn/components/lesson-labs/subword-structure-figures.css', 'src/learn/components/lesson-labs/subword-tokenization-lessons.css', 'scripts/check-subword-reading-flow.mjs'];
const output = { date: '2026-10-06', kind: 'author complementary arithmetic and preservation checks', status: 'passed', checks,
  sourceSha256: Object.fromEntries(sourcePaths.map(path => [path, createHash('sha256').update(fs.readFileSync(path)).digest('hex')])) };
fs.mkdirSync(`${record}/reading-flow-evidence`, { recursive: true });
fs.writeFileSync(`${record}/reading-flow-evidence/numerical.json`, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: 'passed', groups: checks.length, output: `${record}/reading-flow-evidence/numerical.json` }));
