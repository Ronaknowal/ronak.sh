import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { sum, softmax, kl, entropy, loss, gradient, update, categorical, family,
  teacherLogits, studentLogits, sequence, sampleSequence, cost, traceCheck } from '../src/learn/data/distillation-models.js';

const topic = 'docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation';
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
let conditions = 0;
function near(a, b, tolerance = 2e-10) {
  assert.ok(Math.abs(a - b) < tolerance, `${a} versus ${b}`);
  conditions++;
}
function compare(a, b) {
  if (Array.isArray(a)) a.forEach((value, j) => compare(value, b[j]));
  else near(a, b);
}
const content = read(`${topic}/content-root-inputs.json`).files;
for (const [path, expected] of Object.entries(content)) assert.equal(sha(path), expected, path);
for (const temperature of [.25, 1, 2, 8, 128]) {
  const q = softmax(teacherLogits, temperature);
  const p = softmax(studentLogits, temperature);
  near(sum(q), 1);
  compare(q, softmax(teacherLogits.map(value => value + 31), temperature));
  near(kl(q, q), 0);
  for (const kind of ['forward', 'reverse', 'jsd']) for (const scaled of [false, true]) {
    const g = gradient(q, p, kind, temperature, scaled);
    near(sum(g), 0);
    for (let coordinate = 0; coordinate < 4; coordinate++) {
      const plus = [...studentLogits];
      const minus = [...studentLogits];
      plus[coordinate] += 1e-5;
      minus[coordinate] -= 1e-5;
      const objective = values => loss(q, softmax(values, temperature), kind) * (scaled ? temperature ** 2 : 1);
      near(g[coordinate], (objective(plus) - objective(minus)) / 2e-5, 4e-7);
    }
  }
  compare(update(temperature, 0).next, studentLogits);
  compare(update(temperature, .4, true, true).g, [0, 0, 0, 0]);
}
const recorded = read('public/learn-code/llm-distillation/results/mechanisms/sequence-results.json');
for (const [index, shift] of [0, -.4, .5].entries()) {
  const actual = sequence(shift);
  const expected = recorded.cases[index];
  for (const [key, original] of [['q', 'teacher_rows'], ['p', 'student_rows'], ['qLeaf', 'teacher_joint'],
    ['pLeaf', 'student_joint'], ['ce', 'sequence_ce'], ['reverse', 'reverse_kl'],
    ['detached', 'detached_gradient'], ['visitation', 'visitation_gradient'], ['full', 'full_gradient']]) {
    compare(actual[key], key === 'visitation' ? expected[original][0] : expected[original]);
  }
}
compare(sequence(.3, true).visitation, [0, 0]);
for (const u of [.001, .024, .1, .5, .976, .999]) {
  near(sum(family(u)), 1);
  assert.ok(kl([.49, .02, .49], family(u)) >= kl([.49, .02, .49], family(.5)) - 1e-12);
  conditions++;
}
assert.equal(categorical([0, .2, 0, .8], 0), 1);
assert.equal(categorical([0, .2, 0, .8], .2), 3);
const finite = sequence();
assert.deepEqual(sampleSequence(71, 42, finite.qLeaf, finite.pLeaf), sampleSequence(71, 42, finite.qLeaf, finite.pLeaf));
near(sum(sampleSequence(100, 31, finite.qLeaf, finite.pLeaf).counts), 100);
near(cost(3000, 60, .03, .01).teacher, cost(3000, 60, .03, .01).student);
assert.equal(cost(1000, 60, .03, .03).breakEven, null);
assert.deepEqual(traceCheck(2, 3, 4, 6, 20, 20), { final: true, steps: false });
near(entropy([.6, .2, .15, .05]), 1.0627375681569962);
const observations = read('public/learn-assets/llm-distillation/observations.json');
const candidates = read('public/learn-code/llm-distillation/results/arithmetic/teacher-candidates.json');
const evaluation = read('public/learn-code/llm-distillation/results/arithmetic/evaluation.json');
for (const [path, expected] of Object.entries(observations.sources)) {
  assert.equal(sha('public/learn-code/llm-distillation/results/arithmetic/' + path), expected);
}
assert.equal(observations.candidates.length, 256);
for (const [index, row] of observations.candidates.entries()) {
  const original = candidates.candidates[index];
  assert.deepEqual(row.check, original.check);
  assert.equal(row.text, original.text);
  conditions += 2;
}
for (const row of observations.examples) {
  const original = candidates.candidates.find(item => item.id === row.id);
  assert.deepEqual(row.log_probs, original.log_probs);
  row.log_probs.forEach(logs => near(sum(logs.map(Math.exp)), 1, 1e-6));
  conditions++;
}
for (const [index, row] of observations.students.entries()) for (const split of ['test', 'shift']) {
  for (const key of ['correct', 'invalid', 'records']) near(row.results[split][key], evaluation.students[index].results[split][key]);
  near(row.results[split].reference_nll, evaluation.students[index].results[split].reference.nll);
}
const runtime = [`${topic}/lesson.jsx`, 'src/learn/data/distillation-models.js',
  ...['Shared', 'Foundations', 'Sequences', 'Evidence'].map(name => `src/learn/components/lesson-labs/Distillation${name}.jsx`),
  'src/learn/components/lesson-labs/distillation-flow.css', 'public/learn-assets/llm-distillation/observations.json',
  'scripts/render-distillation-lesson.mjs', 'scripts/project-distillation-observations.py', 'scripts/verify-distillation-runtime.mjs'];
for (const path of runtime.filter(path => /\.(mjs|js|jsx)$/.test(path))) parse(fs.readFileSync(path, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
const source = fs.readFileSync(`${topic}/lesson.jsx`, 'utf8');
assert.equal((source.match(/<Distill[A-Z]\w* \/>/g) || []).length, 28);
assert.equal((source.match(/<Program file=/g) || []).length, 12);
assert.equal((source.match(/data-lesson-exercise/g) || []).length, 15);
assert.ok(!source.includes('$$'));
const report = { status: 'passed', conditions, content_guards: Object.keys(content).length,
  inputs: Object.fromEntries(runtime.map(path => [path, sha(path)])),
  scope: 'Current finite models versus manual finite differences and recorded Python mechanism outputs; exact saved-data projection. No scientific fits, inference or generation replay.' };
const path = `${topic}/runtime-model-checks.json`;
assert.ok(!fs.existsSync(path), 'Preserve original receipt before any successor');
fs.writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, conditions, content_guards: report.content_guards }));
