import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { latentManualCase, latentTransferCase, latentCaseRead, latentBasisStatus, latentBlockMerge, latentMovementPoints } from '../src/learn/data/latent-attention-reading-fixtures.js';
import { latentRead, latentForecast, difference } from '../src/learn/data/latent-attention-models.js';
import { latentForecastTrace } from '../src/learn/data/latent-attention-reading-traces.js';

const owner = 'docs/teaching/deep-learning-beginner/multi-head-latent-attention-mla';
const checks = [];
function close(name, actual, expected, tolerance = 1e-11) {
  const error = difference(Array.isArray(actual) ? actual : [actual], Array.isArray(expected) ? expected : [expected]);
  assert.ok(error <= tolerance, `${name}: ${error} > ${tolerance}`);
  checks.push({ name, error, tolerance, pass: true });
}
function condition(name, value) { assert.ok(value, name); checks.push({ name, pass: true }); }

for (const [fixture, state] of [['manual', latentManualCase()], ['transfer', latentTransferCase()]]) {
  const result = latentCaseRead(state), original = latentRead(state);
  for (let head = 0; head < 2; head++) {
    close(`${fixture}: original head ${head} logits`, result.heads[head].logits, original[head].logits);
    close(`${fixture}: original head ${head} weights`, result.heads[head].weights, original[head].weights);
    close(`${fixture}: expanded/absorbed head ${head}`, result.heads[head].expandedOutput, result.heads[head].absorbedOutput);
    close(`${fixture}: effective query head ${head}`, result.heads[head].content, result.heads[head].absorbedContent);
  }
  close(`${fixture}: diagonal coordinate change`, latentCaseRead(state, { basis: [[2,0],[0,.5]] }).absorbedOutput, result.absorbedOutput);
  close(`${fixture}: non-diagonal coordinate change`, latentCaseRead(state, { basis: [[2,1],[.5,1]] }).absorbedOutput, result.absorbedOutput);
  close(`${fixture}: uniformly small invertible basis`, latentCaseRead(state, { basis: [[1e-150,0],[0,1e-150]] }).absorbedOutput, result.absorbedOutput);
  const nonlinear = latentCaseRead(state, { nonlinear: true });
  const nonlinearOld = latentRead(state, { nonlinear: true, expanded: true });
  close(`${fixture}: preserved nonlinear expanded semantics`, nonlinear.heads.map(head=>head.expandedOutput), nonlinearOld.map(head=>head.output));
  const merge = latentBlockMerge(result.heads[0].logits, result.latent, result.legal, 1);
  close(`${fixture}: unequal-mass block merge`, merge.output, result.heads[0].mixture);
  const edited = structuredClone(state);
  edited.valueUp[0][0][1] = -2.7;
  const valueChange = latentCaseRead(edited);
  close(`${fixture}: value-only edit preserves weights`, valueChange.heads[0].weights, result.heads[0].weights);
  condition(`${fixture}: value-only edit changes write`, difference(valueChange.heads[0].absorbedOutput, result.heads[0].absorbedOutput)>1e-4);
  const reversed = { ...state, latent: [...state.latent].reverse(), keyRotary: [...state.keyRotary].reverse(), positions: [...state.positions].reverse() };
  close(`${fixture}: complete record permutation`, latentCaseRead(reversed).absorbedOutput, result.absorbedOutput);
  const shifted = { ...state, positions: state.positions.map(id=>id+1), queryPosition: state.queryPosition+1 };
  close(`${fixture}: common logical shift`, latentCaseRead(shifted).absorbedOutput, result.absorbedOutput);
}
close('content-only opening output', latentCaseRead(latentManualCase(), { positioned: false }).absorbedOutput, [1.693840733574778,.7676003184816189]);
close('positioned opening output', latentCaseRead(latentManualCase()).absorbedOutput, [1.6876908776994628,.9627827688703258]);
const empty = { ...latentManualCase(), positions: [1,2,3], queryPosition: 0 };
condition('all-masked row explicitly undefined', latentCaseRead(empty).defined===false && latentCaseRead(empty).heads===null);
condition('singular compensated basis explicitly undefined', latentCaseRead(latentManualCase(), { basis: [[1,1],[1,1]] }).defined===false);
close('small well-conditioned basis remains condition one', latentBasisStatus([[1e-150,0],[0,1e-150]]).condition, 1);
condition('inverse outside numeric range is identified', latentBasisStatus([[Number.MIN_VALUE,0],[0,Number.MIN_VALUE]]).inverse===null);
condition('both empty merge blocks explicitly undefined', latentBlockMerge([0,1],[[1,0],[0,1]],[false,false],1).defined===false);
const oneLegal = latentBlockMerge([0,1],[[1,0],[0,1]],[false,true],1);
close('one empty block contributes no mass',oneLegal.output,[0,1]);

const payload = JSON.parse(fs.readFileSync('public/learn-assets/multi-head-latent-attention-mla/runtime.json','utf8'));
close('pre-download point fixture is byte-derived exact',latentMovementPoints,payload.points,0);
for (const [caseName, points] of [['prefix32',payload.points.slice(0,32)],['prefix40',payload.points.slice(0,40)],['edited27',payload.points.slice(0,27).map((point,i)=>i===19?[point[0],1-point[1]]:point)]]) {
  for (const rank of [null,1,4,8]) {
    const basis = rank===null ? null : payload.completeBasis.map(row=>row.slice(0,rank));
    const options = { basis, shift: 17, wrongScale: rank===4 };
    const trace = latentForecastTrace(payload.weights,points,options);
    const original = latentForecast(payload.weights,points,options);
    close(`${caseName}/rank${rank}: complete traced task route`,trace.taskOutput,original.predictions,0);
    close(`${caseName}/rank${rank}: traced normalized latent`,trace.latentNorm.output,original.fullLatents,0);
    close(`${caseName}/rank${rank}: traced stored latent`,trace.latent,original.cache.latents,0);
    close(`${caseName}/rank${rank}: traced rotary keys`,trace.keyRotary,original.cache.rotaryKeys,0);
    close(`${caseName}/rank${rank}: both trace result owners`,trace.predictions,trace.taskOutput,0);
    condition(`${caseName}/rank${rank}: stem/FFN/task extents`,trace.stem[0].length===24 && trace.feedforwardExpanded[0].length===48 && trace.taskOutput[0].length===2);
  }
}
const bindings = ['src/learn/data/latent-attention-reading-fixtures.js','src/learn/data/latent-attention-reading-traces.js','src/learn/data/latent-attention-models.js','src/learn/data/grouped-query-models.js','public/learn-assets/multi-head-latent-attention-mla/runtime.json',import.meta.filename.replaceAll('\\','/').split('/Portfolio/Portfolio/').at(-1)].map(path=>({ path, sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex') }));
const report = { topicId:'multi-head-latent-attention-mla',savedAt:new Date().toISOString(),scope:'Author partial implementation helper checks only. No final manuscript/drawing/browser certification; no native fit or historical receipt replay.',bindings,checks };
fs.writeFileSync(`${owner}/reading-flow-author-helper-checks.json`,JSON.stringify(report,null,2)+'\n');
console.log(`${checks.length} scoped helper checks passed; no fitting or historical report overwritten.`);
