import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import * as m from '../src/learn/data/curation-pipeline-models.js';

const folder = 'docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const output = process.argv[2] || `${folder}/runtime-independent-probes-initial.json`;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = ['src/learn/data/curation-pipeline-models.js', 'src/learn/data/curation-pipeline-recorded-study.json', 'src/learn/components/lesson-labs/CurationPipelineFlow.jsx', `${folder}/lesson.jsx`, 'public/learn-code/data-curation-pipelines/curation_signals.py', 'scripts/verify-curation-pipeline-independent.mjs'];
const before = Object.fromEntries(files.map(file => [file, hash(file)]));
const checks = [], failures = [];
const check = (name, action) => {
  try { const detail = action(); checks.push({ name, detail, passed: true }); }
  catch (error) { failures.push({ name, error: String(error) }); }
};
const close = (a, b, tolerance = 1e-11) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const lineBreaks = ['\n', '\r', '\r\n', '\v', '\f', '\u001c', '\u001d', '\u001e', '\u0085', '\u2028', '\u2029'];
const strings = lineBreaks.map(sep => `aaaa${sep}b${sep}aaaa`);
strings.push(' a\u001fb \na b', '\ufeffx\nx', '😀\n😀', ' \n\t');
const native = spawnSync(path.resolve('scratch/lesson-tools/Scripts/python.exe'), ['-B', '-X', 'utf8', '-c',
  "import sys,json; sys.path.insert(0,'public/learn-code/data-curation-pipelines'); from curation_signals import signals; print(json.dumps([signals(s) for s in json.load(sys.stdin)]))"
], { input: JSON.stringify(strings), encoding: 'utf8' });
assert.equal(native.status, 0, native.stderr);
const expected = JSON.parse(native.stdout);
strings.forEach((text, i) => check(`Native Python normalization case ${i}`, () => {
  const js = m.repetition(text), py = expected[i];
  assert.equal(js.rows.length, py.nonempty_lines);
  assert.equal(js.characters, py.line_characters);
  assert.equal(js.duplicateLines, py.duplicate_lines);
  assert.equal(js.duplicateCharacters, py.duplicate_characters);
  assert.equal(js.characterShare, py.duplicate_character_share);
  return { text, lines: js.rows.length, share: js.characterShare };
}));
check('Native normalization discrepancy details', () => strings.map((text, i) => ({ text, javascript: m.repetition(text), python: expected[i] })));
check('Complementary BCE gradients: both labels, intercept, weight extremes', () => {
  let cases = 0;
  for (const label of [0, 1]) for (const w0 of [-2, 0, 2]) for (const w1 of [-2, 0, 2]) {
    const args = { label, w: [w0, w1], b: -0.7, l2: 0.1, rate: 0.3 };
    const r = m.gradientStep(args), eps = 1e-5;
    for (let j = 0; j < 2; j++) {
      const plus = [w0, w1], minus = [w0, w1]; plus[j] += eps; minus[j] -= eps;
      close((m.gradientStep({ ...args, w: plus }).loss - m.gradientStep({ ...args, w: minus }).loss)/(2*eps), r.gradient[j], 1e-9);
    }
    close((m.gradientStep({ ...args, b: args.b+eps }).loss - m.gradientStep({ ...args, b: args.b-eps }).loss)/(2*eps), r.residual, 1e-9);
    cases++;
  }
  return { cases, derivatives: cases*3 };
});
check('Every binary four-record labeling across 21 thresholds', () => {
  for (let mask=0; mask<16; mask++) for (let tick=0; tick<=20; tick++) {
    const rows = [0, .35, .7, 1].map((score, i) => ({id:String(i),score,label:(mask>>i)&1}));
    const threshold=tick/20, result=m.metrics(rows,m.select(rows,'threshold',threshold));
    const tp=rows.filter(r=>r.score>=threshold&&r.label===1).length;
    const kept=rows.filter(r=>r.score>=threshold).length;
    const positives=rows.filter(r=>r.label===1).length;
    assert.equal(result.precision, kept?tp/kept:null);
    assert.equal(result.recall, positives?tp/positives:null);
    assert.equal(result.f1, kept+positives?2*tp/(kept+positives):null);
    assert.equal(result.tp+result.fp+result.fn+result.tn,4);
  }
  return { cases:336 };
});
check('Calibration endpoints and ties retain all support', () => {
  const rows=[0,.2,.4,.6,.8,1].map((score,i)=>({id:String(i),score,label:i%2}));
  assert.deepEqual(m.calibration(rows).map(b=>b.count),[1,1,1,1,2]);
  return m.calibration(rows);
});
check('Reference endpoint normalization and repeated-candidate invariance', () => {
  for(const kind of ['general','target','empty']) for(const alpha of [.25,2]) {
    const ref=m.reference(kind,alpha);
    close(ref.probabilities.reduce((a,b)=>a+b,0),1);
    const single=m.surprise('pendulum unknown energy',ref), twice=m.surprise('pendulum unknown energy pendulum unknown energy',ref);
    close(twice.total,2*single.total); close(twice.mean,single.mean);
  }
  return { cases:6 };
});
check('Nearest-even boundary and clamp cases', () => {
  assert.deepEqual([-.5,.5,1.5,2.5,3.5,4.5,5.5].map(x=>m.neuralPolicy(x).integer),[0,0,2,2,4,4,5]);
  return { cases:7 };
});
check('All 424 displayed final rows and actual native head receipt unchanged', () => {
  const adapter=JSON.parse(fs.readFileSync('src/learn/data/curation-pipeline-recorded-study.json'));
  const full=JSON.parse(fs.readFileSync('public/learn-code/data-curation-pipelines/study.json'));
  assert.deepEqual(adapter.predictions,full.predictions.filter(r=>r.split==='final'));
  assert.equal(adapter.sourceSha256,hash('public/learn-code/data-curation-pipelines/study.json'));
  const neural=JSON.parse(fs.readFileSync('public/learn-code/data-curation-pipelines/neural-result.json'));
  assert.deepEqual(adapter.neural.examples,neural.examples);
  return { finalRows:adapter.predictions.length, neuralExamples:neural.examples.length };
});
check('Content freeze and all original runtime sources have recorded identities', () => {
  const accepted=JSON.parse(fs.readFileSync(`${folder}/content-acceptance.json`));
  for (const [p,h] of Object.entries(accepted.bindings)) assert.equal(hash(p),h,p);
  return { protectedContent:Object.keys(accepted.bindings).length };
});
const after=Object.fromEntries(files.map(file=>[file,hash(file)]));
assert.deepEqual(before,after,'Sources changed during independent probes');
fs.writeFileSync(output,JSON.stringify({reviewer:'training_author',at:new Date().toISOString(),before,after,checks,failures,scope:'Read-only native normalization, complementary finite differences and held-out data integrity. No fits or neural inferences replayed.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checks:checks.length,failures,output}));
