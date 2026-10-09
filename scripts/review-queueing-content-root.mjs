// Complementary source and saved-observation checks; no simulation replay.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const base = 'docs/teaching/llm-architecture-training/queueing-theory-for-llm-serving';
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const checks = [];
function check(name, condition) { assert.ok(condition, name); checks.push(name); }
const packet = `${base}/content-inputs.json`;
check('exact whole content packet', sha(packet) === '8fd4f573a42931851b475df1ae7138aa9363e02102b47bf6cd1fd5e6d6a14f33');
for (const row of JSON.parse(fs.readFileSync(packet)).inputs) check(row.path, sha(row.path) === row.sha256);
const lesson = fs.readFileSync(`${base}/lesson.md`, 'utf8');
const cases = JSON.parse(fs.readFileSync(`${base}/native-continuation/report.json`));
check('nine remaining PS cases', cases.ps_cases.length === 9 && cases.passed && cases.remaining_trace_replays === 2 && cases.boundary_checks === 33);
for (const row of cases.ps_cases) {
  check(`${row.case} bounded event count`, row.event_count <= 60001);
  check(`${row.case} original work tolerance`, Math.abs(row.nominal_processed_work - row.attained_work) < 1e-9 * Math.max(1, row.submitted_work));
  check(`${row.case} positive values and declared sample`, row.mean_response > 0 && row.response_p99 >= row.mean_response && row.cohort_count === 25000);
}
const formula = [
  [Math.log(100), 4.605170185988092], [Math.log(80), 4.382026634673881],
  [-Math.log(.8) / .8, .2789294391427621], [1.25 * .7 / .3 * .5, 35 / 24],
  [.3 * 4 / .8, 1.5], [.3 * 10 / .8, 3.75], [1 + .2 + .2 ** 2, 1.24],
];
formula.forEach(([a,b],i) => check(`independent scalar ${i}`,Math.abs(a-b)<1e-12));
check('all eighteen prompt/hint/solution triples', (lesson.match(/\*\*Problem\.\*\*/g)||[]).length === 18 && (lesson.match(/\*\*Hint\.\*\*/g)||[]).length === 18 && (lesson.match(/\*\*Solution\.\*\*/g)||[]).length === 18);
check('retained tail mismatch', lesson.includes('72.301') && lesson.includes('46.052'));
check('original failure explained', lesson.includes('1.455×10⁻¹²') && lesson.includes('zero-duration'));
fs.writeFileSync(`${base}/content-review-root-checks.json`, JSON.stringify({ passed: checks.length, checks, scope: 'Full source guard plus saved continuation/scalar checks; no model, queue simulation, original main or study replay.' }, null, 2)+'\n', { flag:'wx' });
console.log(JSON.stringify({ passed: checks.length }));
