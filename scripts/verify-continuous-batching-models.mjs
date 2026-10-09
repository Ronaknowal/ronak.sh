import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { schedule, originalJobs, PagePool, simulate, pageAttention, segmentedAttention, projection, chunkGeometry, pipeline } from '../src/learn/data/continuous-batching-models.js';
const base = 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention';
const read = name => JSON.parse(fs.readFileSync(`${base}/research/${name}`, 'utf8'));
let count = 0;
function same(a, b) {
  if (typeof a === 'number' && typeof b === 'number') { assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`); count++; }
  else if (Array.isArray(a)) { assert.equal(a.length, b.length); a.forEach((value, i) => same(value, b[i])); }
  else if (a && typeof a === 'object') { for (const key of Object.keys(a)) same(a[key], b[key]); }
  else { assert.deepEqual(a, b); count++; }
}
for (const mode of ['continuous', 'static']) same(schedule(originalJobs, 4, mode), read('iteration-results.json').main[mode]);
const saved = read('serving-simulation-results.json').cases;
const configurations = { chunks4: { chunk: 4 }, whole_prefill: { chunk: 64 }, tight_incremental: { pages: 5 }, rebuild_after_output: { pages: 8 }, cap_reservation: { pages: 5, reservation: true } };
for (const [name, options] of Object.entries(configurations)) {
  const current = simulate(undefined, options), expected = saved[name];
  same(current.requests, expected.requests); same(current.events, expected.events); same(current.finish, expected.finish);
  same(current.iterations.map(row => ({ ...row, pool: { tables: row.pool.tables, lengths: row.pool.lengths, refs: row.pool.refs, free: row.pool.free } })), expected.iterations);
}
for (const prefix of [0, 1, 3, 4, 5]) {
  const pool = new PagePool(8, 3); pool.create('A'); pool.append('A', [0, 1, 2, 3, 4]); pool.fork('A', 'B', prefix);
  const parent = pool.dense('A'); pool.append('B', [9, 10]); same(pool.dense('A'), parent); same(pool.dense('B'), [...parent.slice(0, prefix), 9, 10]);
  pool.release('A'); pool.release('B'); same(pool.refs, Array(8).fill(0));
}
const tight = new PagePool(2, 3); tight.create('A'); tight.append('A', [1, 2, 3, 4, 5]); tight.fork('A', 'B', 4); const before = tight.snapshot(); assert.throws(() => tight.append('B', [9])); same(tight.snapshot(), before);
for (const offset of [-1000, 0, 1000]) for (const size of [1, 2, 3, 4]) { const out = pageAttention([0, Math.log(2), Math.log(3), Math.log(4)].map(x => x + offset), [2, 0, 4, 1], size); same(out.output, 1.8); same(out.output, out.dense); }
same(pageAttention([1], [2], 1, [false]).output, null);
for (const perturb of [-2, 0, 5]) { same(segmentedAttention(perturb).keyed.B50, 7); same(segmentedAttention(perturb, false, true).keyed, segmentedAttention(perturb).keyed); }
same(projection().offsets, [0, 2, 3]);
for (const size of [2, 3, 4, 6]) same(chunkGeometry(12, size).pairs, 78);
same(pipeline(2).finish, 8); same(pipeline(3).finish, 11);
const source = 'src/learn/data/continuous-batching-models.js';
const report = { passed: true, conditions: count, source: createHash('sha256').update(fs.readFileSync(source)).digest('hex'), scope: 'Browser finite model correspondence with saved Python outputs, changed allocator/normalization/isolation fixtures. No Python scientific replay.' };
fs.writeFileSync(`${base}/runtime-model-checks.json`, JSON.stringify(report, null, 2)+'\n');
console.log(report);
