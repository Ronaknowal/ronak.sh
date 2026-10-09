import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { scalarRecurrence, lstmAccounting, resetPlacement } from '../src/learn/data/recurrent-models.js';

const paths = ['src/learn/data/topics/rnns-lstms-grus.jsx', 'src/learn/components/lesson-labs/RecurrentDrawings.jsx',
  'src/learn/components/lesson-labs/RecurrentFlowLabs.jsx', 'src/learn/components/lesson-labs/RecurrentLabs.jsx',
  'src/learn/components/lesson-labs/RecurrentIntuitionFigures.jsx', 'src/learn/components/lesson-labs/recurrent-flow.css',
  'src/learn/components/lesson-labs/recurrent-intuition.css', 'src/learn/components/lesson-labs/recurrent-labs.css',
  'public/learn-assets/rnns-lstms-grus/recurrent-cells.py'];
const source = fs.readFileSync(paths[0], 'utf8');
for (const path of paths.filter(p => p.endsWith('.jsx'))) parse(fs.readFileSync(path, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
assert.equal((source.match(/data-lesson-exercise=""/g) || []).length, 8);
assert.equal((source.match(/<H2>/g) || []).length, 11);
assert.equal((source.match(/<details>/g) || []).length, 18);
assert.ok(source.includes('lesson-flow recurrent-flow-lesson'));
assert.ok(!source.includes('Predict the effect'));
for (const [before, after] of [ ['<RecurrentAffineFigure', 'a_t=W_x'], ['<RecurrentCreditPicture', '\\delta_t='],
  ['<RecurrentGateFigure', 'i_t&='], ['<GruCandidateFigure', 'r_t&='],
  ['<RecurrentDirectionsFigure', 'pack_padded_sequence'], ['<RecurrentDirectionProductFigure', 'A=\\\\begin'],
  ['<LstmJacobianFigure', '\\frac{\\\\partial(h_t,c_t)'], ['<LstmProjectionFigure', '4H(D+P+2)'] ]) {
  assert.ok(source.indexOf(before) >= 0 && source.indexOf(after) > source.indexOf(before), `${before} must precede ${after}`);
}
const fixture = scalarRecurrence({ inputs: [.4, -.2, .7], inputWeight: .8, recurrentWeight: .6, bias: .1, initial: 0, target: .3, rate: .1 });
const rounded = v => v.toFixed(6);
for (const v of [...fixture.states.slice(1), fixture.loss, ...Object.values(fixture.gradient), ...Object.values(fixture.updated), fixture.updatedLoss]) assert.ok(source.includes(rounded(v)), rounded(v));
assert.ok(source.includes(Math.tanh(.59).toFixed(6).replace(/^0/, '')));
assert.ok(source.includes(Math.tanh(-.02).toFixed(6).replace('-0', '−')));
const cell = lstmAccounting({ cell: .8, forget: .9, input: .2, candidate: -.5, output: .6 });
assert.ok(source.includes(rounded(cell.hidden)));
const reset = resetPlacement([1, 2], [.2, .8], [[1, 2], [3, 4]], [.5, -.5]);
assert.deepEqual(reset.before.map(v => Number(v.toFixed(8))), [3.9, 6.5]);
assert.deepEqual(reset.after.map(v => Number(v.toFixed(8))), [1.1, 8.4]);
const data = JSON.parse(fs.readFileSync('public/learn-assets/rnns-lstms-grus/calculated-inputs.json'));
const summaries = JSON.parse(fs.readFileSync('public/learn-assets/rnns-lstms-grus/recurrent-evidence.json'));
const counted = [];
for (const run of data.runs) for (const probe of ['final', 'reversed', 'swapped_points_3_4']) {
  const row = run[probe];
  const predictions = row.probabilities.map(p => p.indexOf(Math.max(...p)));
  assert.deepEqual(predictions, row.predictions);
  const correct = predictions.filter((p, i) => p === data.development_labels[i]).length;
  assert.equal(correct, row.correct);
  const loss = -row.probabilities.reduce((s, p, i) => s + Math.log(p[data.development_labels[i]]), 0) / predictions.length;
  // The original fit exports float32 softmax probabilities and a float32
  // cross_entropy reduction. Recomputing their logs in double need not be exact.
  const crossEntropyTolerance = 4 * 2 ** -23 * Math.max(1, loss);
  assert.ok(Math.abs(loss - row.cross_entropy) < crossEntropyTolerance);
  const summary = summaries.runs.find(r => r.kind === run.kind && r.seed === run.seed);
  assert.equal(summary[probe].correct, correct);
  counted.push({ kind: run.kind, seed: run.seed, probe, correct, crossEntropy: loss, recordedCrossEntropy: row.cross_entropy, crossEntropyTolerance });
}
const receipt = { passed: true, sourceHashes: Object.fromEntries([...paths, 'scripts/verify-recurrent-reading-source.mjs'].map(p => [p, createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),
  groups: ['Five JSX parses', 'Eight complete exercises, eighteen disclosures and eleven main anchors retained', 'Foundational drawings precede selected formal/API statements',
    'Rendered manuscript numeric tokens match declared scalar/affine/cell/reset fixtures', 'All 27 fitted probability arrays independently recounted and cross-entropy recomputed'], counted,
  limit: 'Source/order and numerical checks only; independent whole lesson review and actual browser layout remain separate.' };
fs.writeFileSync('docs/teaching/deep-learning-beginner/rnns-lstms-grus/reading-flow-source.json', JSON.stringify(receipt, null, 2) + '\n');
console.log('PASS: source conservation, numerical tokens and 27 recorded probes.');
