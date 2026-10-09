import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { contextTrace, conditionalUpdate, selectedLoss, maskedBatch, packGraph, capstone } from '../src/learn/data/sft-models.js';

const topic = 'docs/teaching/llm-architecture-training/supervised-fine-tuning-sft';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const data = read('src/learn/data/sft-runtime-data.json');
const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const checks = [];
const acceptance = read(`${topic}/content-acceptance.json`);
for (const [path, expected] of Object.entries(acceptance.bindings)) assert.equal(sha(path), expected, path);
const fixture = data.context_fixture;
const trace = contextTrace(fixture);
const expected = data.reports['objective-report.json'];
near(trace.loss, expected.before_loss);
trace.dembedding[1].forEach((value, i) => near(value, expected.prompt_embedding_gradient[i]));
near(contextTrace({ ...fixture, ...trace.updated }).loss, expected.after_loss);
let derivativeChecks = 0, maximumError = 0;
for (const full of [false, true]) for (const keepContext of [false, true]) {
  const input = structuredClone(fixture);
  if (full) input.labels = [-100, ...input.ids.slice(1)];
  input.visible = input.ids.map((_,j) => input.ids.map((__,k) => k <= j && (keepContext || k !== 1 || j === 1)));
  const result = contextTrace(input);
  for (const [name, gradient] of [['embedding', result.dembedding], ['head', result.dhead]]) {
    input[name].forEach((row, i) => row.forEach((value, j) => {
      input[name][i][j] = value + 1e-6;
      const plus = contextTrace(input).loss;
      input[name][i][j] = value - 1e-6;
      const minus = contextTrace(input).loss;
      input[name][i][j] = value;
      const error = Math.abs((plus-minus)/2e-6 - gradient[i][j]);
      maximumError = Math.max(error, maximumError);
      assert.ok(error < 4e-9);
      derivativeChecks++;
    }));
  }
}
checks.push({ name: 'Full JS mean-context backward matches frozen NumPy and changed central differences', derivativeChecks, maximumError });
for (const target of [4,6]) for (const rate of [0,.1,.5,1]) {
  const result = conditionalUpdate(target,rate);
  assert.ok(result.afterLoss <= result.beforeLoss + 1e-12);
  for (const row of [...result.before,...result.after]) near(row.reduce((a,b)=>a+b,0),1);
}
near(selectedLoss([.5,.25],[true,true]).mean, -Math.log(.125)/2);
assert.equal(selectedLoss([.5,.25],[false,false]).mean,null);
assert.equal(maskedBatch().targets,5); assert.equal(maskedBatch(true).targets,3);
assert.equal(packGraph([5,7]).flat().filter(Boolean).length,43);
assert.equal(packGraph([5,7],false).flat().filter(Boolean).length,78);
const cap = capstone();
assert.equal(cap.count,5); assert.equal(cap.visible.flat().filter(Boolean).length,49);
near(cap.dhead[2][4],-5/84); near(cap.updated.head[2][4],1/168);
checks.push({ name: 'Conditional update, ownership, EOS padding, packing and complete changed-data capstone', capstone_gradient: cap.dhead[2][4] });
const paths = ['src/learn/data/sft-models.js','src/learn/data/sft-runtime-data.json',
  ...['SftFlowShared','SftFoundations','SftBatching','SftStudy'].map(name => `src/learn/components/lesson-labs/${name}.jsx`),
  'src/learn/components/lesson-labs/sft-flow.css','scripts/render-sft-lesson.mjs', `${topic}/lesson.jsx`];
for (const path of paths.filter(path=>path.endsWith('.jsx'))) parse(fs.readFileSync(path,'utf8'),{sourceType:'module',plugins:['jsx']});
checks.push({ name: 'All runtime JSX parses and current frozen content guards pass', guardedContent: Object.keys(acceptance.bindings).length });
const report = { checks, fits:0, scientificGenerations:0, bindings:Object.fromEntries(paths.map(path=>[path,sha(path)])) };
fs.writeFileSync(`${topic}/runtime-model-checks.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
