import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as model from '../src/learn/data/simpo-models.js';
import { observations } from '../src/learn/data/simpo-observations.js';

const folder = 'docs/teaching/llm-architecture-training/simpo-simple-preference-optimization';
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packetPath = `${folder}/runtime-inputs.json`;
const checks = [];
function check(value, label) { assert.ok(value, label); checks.push(label); }
function close(a, b, label, tolerance = 1e-9) { check(Math.abs(a-b) <= tolerance, label); }
check(hash(packetPath) === 'ce221d9f7679a3525cb08a5df6c617b3f72c23c6e91815dc3832f89df6dc430c', 'exact author packet');
const packet = JSON.parse(fs.readFileSync(packetPath));
for (const row of packet.files) check(hash(row.path) === row.sha256, `guard: ${row.path}`);
const renderer = JSON.parse(fs.readFileSync(`${folder}/renderer-receipt.json`));
let manuscript = fs.readFileSync(`${folder}/manuscript.jsx`, 'utf8').replaceAll('\r\n', '\n');
for (const {before,after} of renderer.replacements) {
  check(manuscript.split(before).length === 2, 'one exact renderer replacement');
  manuscript = manuscript.replace(before, after);
}
check(manuscript === fs.readFileSync(`${folder}/lesson.jsx`, 'utf8').replaceAll('\r\n', '\n'), 'complete conserved learner body');
const exported = JSON.parse(fs.readFileSync(`${folder}/observations-export.json`));
for (const [p,digest] of Object.entries(exported.inputs)) check(hash(p) === digest, `raw observation binding: ${p}`);
const raw = {
  algebra:'results/algebra-results.json', response:'results/response-results.json',
  geometry:'results/objective-geometry-results.json', scratch:'results/scratch-results.json',
  native:'results/native-results.json', preflight:'results/native-preflight.json',
  records:'records.json', selection:'selection.json',
};
for(const [name,p] of Object.entries(raw)) {
  assert.deepEqual(observations[name], JSON.parse(fs.readFileSync(`public/learn/examples/simpo/${p}`)));
  checks.push(`complete parsed observation equality: ${name}`);
}
assert.deepEqual(observations.fixture, JSON.parse(fs.readFileSync(`${folder}/runtime-causal-fixture.json`)));
checks.push('complete causal fixture equality');
// Complementary parameter derivatives and orientation exchange, beyond author gap probes.
for(const beta of [0.37,1.15,3.8]) for(const gamma of [0.13,0.71,1.87]) for(const d of [-0.93,0.17,0.67]) {
  const e=1e-5, p=1/(1+Math.exp(beta*d-gamma));
  close((model.pair(d,beta+e,gamma).loss-model.pair(d,beta-e,gamma).loss)/(2*e),-d*p,'beta derivative');
  close((model.pair(d,beta,gamma+e).loss-model.pair(d,beta,gamma-e).loss)/(2*e),p,'absolute gamma derivative');
  for(const q of [0.13,0.37,0.86]) {
    const r=model.repeated(d,q,beta,gamma), s=model.repeated(-d,1-q,beta,gamma);
    close(r.loss,s.loss,'opposite-label exchange loss');
    close(r.derivative,-s.derivative,'opposite-label exchange derivative');
    close(model.repeatedOptimum(q,beta,gamma),-model.repeatedOptimum(1-q,beta,gamma),'opposite-label optimum symmetry');
  }
}
const before=JSON.parse(fs.readFileSync(`${folder}/paint-successor/source-checks.json`));
for(const section of ['files','guarded','conserved'])for(const[p,h]of Object.entries(before[section]))check(hash(p)===h,`successor ${section}: ${p}`);
const lists={
  'browser-v3':[0,...Array.from({length:18},(_,i)=>i+3),24,25,26,27,28,30,...Array.from({length:13},(_,i)=>i+32),62,72],
  'paint-successor/browser-v4':[0,1,2,3,4,...Array.from({length:9},(_,i)=>i+10),20,24,25,...Array.from({length:18},(_,i)=>i+29),54,55,56,57,58],
};
const paint = [];
for(const[rel,nums]of Object.entries(lists))for(const n of nums) {
  const p=`${folder}/${rel}/atlases/atlas-${String(n).padStart(3,'0')}.png`;
  paint.push({path:p,sha256:hash(p)});
}
const result={status:'passed', reviewer:'root', author:'alignment_author', conditions:checks.length,
  scientificFits:0,optimizerSteps:0,neuralGenerations:0,packet:hash(packetPath),checks,
  personallyReadPaint:paint,
  paintScope:'Every mechanism and all sixteen practices at desktop; complete mechanism views at phone composed with successor; all eleven repaired figures and selected complex plots/tables at enlarged text. This is not a claim to personally viewing every author capture or every matrix column.',
  openFinding:'D04 renders a blank padded query row as if it were the computed attention mask; distinguish ignored padding-query output from the causal/key mask.',
};
fs.writeFileSync(`${folder}/runtime-root-checks.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({conditions:checks.length,paint:paint.length,scientificFits:0}));
