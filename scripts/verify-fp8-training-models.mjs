import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as m from '../src/learn/data/fp8-training-models.js';
const passed = [];
for (const name of ['e4m3', 'e5m2']) {
  const f = m.FORMATS[name];
  for (let code = 0; code < 256; code++) {
    const value = m.decode(code, name);
    if (Number.isFinite(value)) assert.equal(m.encode(value, name), code);
  }
  for (let lower = 0; lower < f.maxCode; lower++) {
    const midpoint = (m.decode(lower, name) + m.decode(lower + 1, name)) / 2;
    const expected = lower % 2 ? lower + 1 : lower;
    assert.equal(m.encode(midpoint, name), expected);
    assert.equal(m.encode(-midpoint, name), expected + 128);
  }
  passed.push(name + ' finite code roundtrip, signed zero, all midpoint ties');
}
assert.equal(m.decode(127), NaN); assert.equal(m.decode(124, 'e5m2'), Infinity);
assert.equal(m.decode(255), NaN); assert.equal(m.encode(500), 126);
assert.equal(m.quantize(1.0625), 1); assert.equal(m.quantize(1.1875), 1.25);
assert.deepEqual(m.scaleTrace([0, .001, .002, .004]).recovered, [0, .001, .002, .004]);
assert.equal(m.scaleTrace([0, 0]).scale, 1);
assert.equal(m.scaleTrace([500], 'e4m3', true).scale, 2);
const x = [[100000, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]];
assert.deepEqual(m.grouped(x, 'row').result.slice(1), x.slice(1));
assert.equal(m.grouped(x, 'tensor').bytes, 20);
assert.equal(m.grouped(x, 'block').bytes, 32);
for (const mode of ['tensor', 'row', 'block']) assert.equal(m.grouped(x.map(r => r.map(() => 1)), mode).maxError, 0);
passed.push('Current scale, exact zero, power-of-two, outlier group isolation and metadata null');
const h = m.historyTrace([1, 1, 1, 8, 1, 1, 1, 1]);
assert.deepEqual(h.map(r => r.scale), [1/448,1/448,1/448,1/448,8/448,8/448,8/448,1/448]);
assert.equal(h[3].clipped, 1); assert.equal(h[4].clipped, 0);
passed.push('Applied-before-append history spike, stale capacity and eviction');
const trace = m.matrixTrace([[1,2,3]], [[2,-1,.5]]);
assert.equal(trace.exact[0][0], 1.5);
assert.equal(m.matrixTrace([[0,0,0]],[[2,-1,.5]]).relative, null);
assert.deepEqual(m.mm([[.1,-.2]], [[2,-1,.5],[0,1,1]]), [[.2,-.30000000000000004,-.15000000000000002]]);
const updates = m.masterTrace();
assert.equal(updates[3].copy, 1); assert.equal(updates[4].copy, .9375);
assert(updates.every(p=>p.low===1)); assert(m.masterTrace(0).every(p=>p.master===1&&p.low===1));
passed.push('Three-product shapes, selected dot, zero norm and master update trace');
assert(Math.abs(m.cost().time-.65)<1e-15);assert.equal(m.cost(0,2,0).speedup,1);assert(m.cost(.4,2,.25).speedup<1);
const folder = 'docs/teaching/llm-architecture-training/fp8-training-low-precision-pre-training';
assert.equal(fs.readFileSync('src/learn/data/fp8-training-study.json','utf8'),fs.readFileSync(folder+'/cpu-study.json','utf8'));
const study = JSON.parse(fs.readFileSync(folder+'/cpu-study.json','utf8'));
assert(study.records.every(r=>r.curve.every(p=>p.train_nll>=2.1&&p.heldout_nll>=2.1&&p.train_nll<=4.4&&p.heldout_nll<=4.4)));
passed.push('Assumed cost limits and exact preserved measured curves inside drawn axes');
const files = ['src/learn/data/fp8-training-models.js','src/learn/data/fp8-training-study.json','scripts/verify-fp8-training-models.mjs'];
const result={passed,sources:Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
fs.writeFileSync(folder+'/model-verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
